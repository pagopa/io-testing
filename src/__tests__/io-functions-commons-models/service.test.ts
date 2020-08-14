import { isNone } from "fp-ts/lib/Option";
import {
  SERVICE_COLLECTION_NAME,
  SERVICE_MODEL_PK_FIELD,
  ServiceModel
} from "io-functions-commons/dist/src/models/service";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import {
  aNewService,
  anotherServiceId,
  aService,
  aServiceId
} from "../../../__mocks__/mock";
import { clearAllTestData } from "../../utils/clear_data";
import { database } from "../../utils/cosmosdb";

const container = database.container(SERVICE_COLLECTION_NAME);
const model = new ServiceModel(container);

const failRightPath = "Result must be a right path";
afterEach(
  async () =>
    await clearAllTestData(
      container,
      model,
      aService,
      SERVICE_MODEL_PK_FIELD
    ).run()
);

describe("CRU Operations", () => {
  it("should create a new Service", async () => {
    await model
      .create(aNewService)
      .fold(
        _ => fail(failRightPath),
        result => {
          expect(result).toMatchObject({
            ...aService,
            kind: "IRetrievedService",
            version: 0 as NonNegativeInteger
          });
        }
      )
      .run();
  });
  it("should retrieve a Service", async () => {
    await model
      .create(aNewService)
      .chain(() => model.findLastVersionByModelId([aServiceId]))
      .fold(
        _ => fail(failRightPath),
        maybeResult =>
          maybeResult.foldL(
            () => fail("Result must be some"),
            result =>
              expect(result).toMatchObject({
                ...aService,
                kind: "IRetrievedService"
              })
          )
      )
      .run();
  });

  it("should retrieve a Service by a given serviceId", async () => {
    await model
      .create(aNewService)
      .chain(() => model.findOneByServiceId(aServiceId))
      .fold(
        _ => fail(failRightPath),
        maybeResult =>
          maybeResult.foldL(
            () => fail("Result must be some"),
            result =>
              expect(result).toMatchObject({
                ...aService,
                kind: "IRetrievedService"
              })
          )
      )
      .run();
  });
  it("should upsert a Service", async () => {
    await model.create(aNewService).run();
    await model
      .upsert({
        ...aNewService,
        serviceName: "MyUpdService" as NonEmptyString
      })
      .fold(
        _ => fail(failRightPath),
        result =>
          expect(result).toMatchObject({
            ...aService,
            kind: "IRetrievedService",
            serviceName: "MyUpdService" as NonEmptyString,
            version: 1 as NonNegativeInteger
          })
      )
      .run();
  });
  it("should return a 409 error while trying to insert an existing document", async () => {
    await model
      .create(aNewService)
      .chain(() => model.create(aNewService))
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

  it("should return none if no service was found", async () => {
    await model
      .findLastVersionByModelId([anotherServiceId])
      .fold(
        _ => fail("A valid result is expected"),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });
});
