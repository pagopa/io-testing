import { isNone } from "fp-ts/lib/Option";
import { UserDataProcessingStatusEnum } from "io-functions-commons/dist/generated/definitions/UserDataProcessingStatus";
import {
  USER_DATA_PROCESSING_COLLECTION_NAME,
  USER_DATA_PROCESSING_MODEL_ID_FIELD,
  USER_DATA_PROCESSING_MODEL_PK_FIELD,
  UserDataProcessingModel
} from "io-functions-commons/dist/src/models/user_data_processing";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import {
  aNewUserDataProcessing,
  anotherFiscalCode,
  aUserDataProcessing,
  aUserDataProcessingId
} from "../../../__mocks__/mock";
import { clearAllTestData } from "../../utils/clear_data";
import { database } from "../../utils/cosmosdb";

const container = database.container(USER_DATA_PROCESSING_COLLECTION_NAME);
const model = new UserDataProcessingModel(container);

const failRightPath = "Result must be a right path";
afterEach(
  async () =>
    await clearAllTestData(
      container,
      model,
      {
        ...aUserDataProcessing,
        userDataProcessingId: aUserDataProcessingId
      },
      USER_DATA_PROCESSING_MODEL_PK_FIELD
    ).run()
);

describe("CRU Operations", () => {
  it("should create or update a UserDataProcessing", async () => {
    await model
      .createOrUpdateByNewOne(aUserDataProcessing)
      .fold(
        _ => fail(failRightPath),
        result => {
          expect(result).toMatchObject({
            ...aUserDataProcessing,
            kind: "IRetrievedUserDataProcessing",
            userDataProcessingId: aUserDataProcessingId
          });
        }
      )
      .run();
  });
  it("should retrieve a UserDataProcessing", async () => {
    await model.createOrUpdateByNewOne(aUserDataProcessing).run();
    await model
      .findLastVersionByModelId([
        aNewUserDataProcessing[USER_DATA_PROCESSING_MODEL_ID_FIELD],
        aNewUserDataProcessing[USER_DATA_PROCESSING_MODEL_PK_FIELD]
      ])
      .fold(
        _ => fail("Result must be a right path"),
        maybeResult =>
          maybeResult.foldL(
            () => fail("Result must be some"),
            result =>
              expect(result).toMatchObject({
                ...aUserDataProcessing,
                kind: "IRetrievedUserDataProcessing",
                userDataProcessingId: aUserDataProcessingId
              })
          )
      )
      .run();
  });
  it("should upsert a UserDataProcessing", async () => {
    await model.createOrUpdateByNewOne(aUserDataProcessing).run();
    await model
      .upsert({
        ...aNewUserDataProcessing,
        status: UserDataProcessingStatusEnum.ABORTED,
        userDataProcessingId: aUserDataProcessingId
      })
      .fold(
        _ => fail(failRightPath),
        result =>
          expect(result).toMatchObject({
            ...aUserDataProcessing,
            kind: "IRetrievedUserDataProcessing",
            status: UserDataProcessingStatusEnum.ABORTED,
            userDataProcessingId: aUserDataProcessingId,
            version: 1 as NonNegativeInteger
          })
      )
      .run();
  });
  it("should return an error while trying to insert an existing document", async () => {
    await model.createOrUpdateByNewOne(aUserDataProcessing).run();
    await model
      .create({
        ...aNewUserDataProcessing,
        userDataProcessingId: aUserDataProcessingId,
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

  it("should return none if no userDataProcessing was found", async () => {
    await model
      .findLastVersionByModelId([aUserDataProcessingId, anotherFiscalCode])
      .fold(
        _ => fail("A valid result is expected"),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });
});
