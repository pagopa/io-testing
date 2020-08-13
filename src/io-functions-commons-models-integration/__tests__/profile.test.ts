import { isLeft } from "fp-ts/lib/Either";
import { isNone } from "fp-ts/lib/Option";
import {
  NewProfile,
  Profile,
  PROFILE_COLLECTION_NAME,
  PROFILE_MODEL_PK_FIELD,
  ProfileModel
} from "io-functions-commons/dist/src/models/profile";
import { incVersion } from "io-functions-commons/dist/src/utils/cosmosdb_model_versioned";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { EmailString } from "italia-ts-commons/lib/strings";
import { aNewProfile, aProfile } from "../../../__mocks__/mock";
import { aFiscalCode, anotherFiscalCode } from "../../../__mocks__/mock";
import { clearAllTestData } from "../../utils/clear_data";
import { database } from "../../utils/cosmosdb";

const container = database.container(PROFILE_COLLECTION_NAME);
const model = new ProfileModel(container);

const failRightPath = "Result must be a right path";
afterEach(
  async () =>
    await clearAllTestData(
      container,
      model,
      aProfile,
      PROFILE_MODEL_PK_FIELD
    ).run()
);

describe("CRU Operations", () => {
  it("should create a new Profile", async () => {
    const errorOrResult = await model.create(aNewProfile).run();
    errorOrResult.fold(
      _ => fail(failRightPath),
      result => {
        expect(result).toMatchObject({
          ...aProfile,
          kind: "IRetrievedProfile",
          version: 0 as NonNegativeInteger
        });
      }
    );
  });
  it("should retrieve a UserDataProcessing", async () => {
    await model.create(aNewProfile).run();
    await model
      .findLastVersionByModelId([aFiscalCode])
      .fold(
        _ => fail("Result must be a right path"),
        maybeResult =>
          maybeResult.foldL(
            () => fail("Result must be some"),
            result =>
              expect(result).toMatchObject({
                ...aProfile,
                kind: "IRetrievedProfile"
              })
          )
      )
      .run();
  });
  it("should upsert a Profile", async () => {
    await model.create(aNewProfile).run();
    await model
      .upsert({
        ...aNewProfile,
        email: "test-updated@mail.it" as EmailString
      })
      .fold(
        _ => fail(failRightPath),
        result =>
          expect(result).toMatchObject({
            ...aProfile,
            email: "test-updated@mail.it" as EmailString,
            kind: "IRetrievedProfile",
            version: 1 as NonNegativeInteger
          })
      )
      .run();
  });
  it("should return a 409 error while trying to insert an existing document", async () => {
    await model.create(aNewProfile).run();
    await model
      .create({
        ...aNewProfile,
        version: 0 as NonNegativeInteger
      })
      .fold(
        error => {
          expect(error.kind).toEqual("COSMOS_ERROR_RESPONSE");
          if (error.kind === "COSMOS_ERROR_RESPONSE") {
            expect(error.error.code).toEqual(409);
          }
        },
        _ => fail("No valid result is expected")
      )
      .run();
  });

  it("should return none if no profile was found", async () => {
    await model
      .findLastVersionByModelId([anotherFiscalCode])
      .fold(
        _ => fail("A valid result is expected"),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });
});
