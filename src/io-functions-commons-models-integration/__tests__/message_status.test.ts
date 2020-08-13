import { isLeft } from "fp-ts/lib/Either";
import { isNone } from "fp-ts/lib/Option";
import { MessageStatusValueEnum } from "io-functions-commons/dist/generated/definitions/MessageStatusValue";
import {
  MESSAGE_STATUS_COLLECTION_NAME,
  MESSAGE_STATUS_MODEL_ID_FIELD,
  MessageStatusModel
} from "io-functions-commons/dist/src/models/message_status";
import { incVersion } from "io-functions-commons/dist/src/utils/cosmosdb_model_versioned";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import {
  aNewMessageStatus,
  aSerializedMessageStatus
} from "../../../__mocks__/mock";
import { clearAllTestData } from "../../utils/clear_data";
import { database } from "../../utils/cosmosdb";

const container = database.container(MESSAGE_STATUS_COLLECTION_NAME);
const model = new MessageStatusModel(container);

const failRightPath = "Result must be a right path";
afterEach(
  async () =>
    await clearAllTestData(
      container,
      model,
      aSerializedMessageStatus,
      MESSAGE_STATUS_MODEL_ID_FIELD
    ).run()
);

describe("CRU Operations", () => {
  it("should create or update a Message status", async () => {
    await model
      .create(aNewMessageStatus)
      .fold(
        _ => fail(failRightPath),
        result => {
          expect(result).toMatchObject({
            ...aSerializedMessageStatus,
            kind: "IRetrievedMessageStatus"
          });
        }
      )
      .run();
  });
  it("should retrieve a Message status", async () => {
    await model.create(aNewMessageStatus).run();
    await model
      .findLastVersionByModelId([
        aNewMessageStatus[MESSAGE_STATUS_MODEL_ID_FIELD]
      ])
      .fold(
        _ => fail("Result must be a right path"),
        maybeResult =>
          maybeResult.foldL(
            () => fail("Result must be some"),
            result =>
              expect(result).toMatchObject({
                ...aSerializedMessageStatus,
                kind: "IRetrievedMessageStatus"
              })
          )
      )
      .run();
  });
  it("should upsert a Message status", async () => {
    await model.create(aNewMessageStatus).run();
    await model
      .upsert({
        ...aNewMessageStatus,
        status: MessageStatusValueEnum.FAILED
      })
      .fold(
        _ => fail(failRightPath),
        result =>
          expect(result).toMatchObject({
            ...aSerializedMessageStatus,
            kind: "IRetrievedMessageStatus",
            status: MessageStatusValueEnum.FAILED,
            version: 1 as NonNegativeInteger
          })
      )
      .run();
  });
  it("should return an error while trying to insert an existing document", async () => {
    await model.create(aNewMessageStatus).run();
    await model
      .create({
        ...aNewMessageStatus,
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
      .findLastVersionByModelId([
        aNewMessageStatus[MESSAGE_STATUS_MODEL_ID_FIELD]
      ])
      .fold(
        _ => fail("A valid result is expected"),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });
});
