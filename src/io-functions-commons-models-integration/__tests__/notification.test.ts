import { isNone, isSome } from "fp-ts/lib/Option";
import {
  NOTIFICATION_COLLECTION_NAME,
  NOTIFICATION_MODEL_PK_FIELD,
  NotificationModel
} from "io-functions-commons/dist/src/models/notification";
import {
  aMessageId,
  aNewEmailNotification,
  anotherMessageId,
  aNotification
} from "../../../__mocks__/mock";
import { clearAllTestData } from "../../utils/clear_data";
import { database } from "../../utils/cosmosdb";

const container = database.container(NOTIFICATION_COLLECTION_NAME);
const model = new NotificationModel(container);

const failRightPath = "Result must be a right path";
const validResultExpected = "A valid result is expected";
afterEach(async () => {
  await clearAllTestData(
    container,
    model,
    aNotification,
    NOTIFICATION_MODEL_PK_FIELD
  ).run();
});

describe("CRU Operations", () => {
  it("should create a new Notification", async () => {
    await model
      .create(aNewEmailNotification)
      .fold(
        _ => fail(failRightPath),
        result => {
          expect(result).toMatchObject({
            ...aNotification,
            kind: "IRetrievedNotification"
          });
        }
      )
      .run();
  });
  it("should retrieve a notification", async () => {
    await model.create(aNewEmailNotification).run();
    await model
      .findOneByQuery({
        parameters: [
          {
            name: "@partitionKey",
            value: aNotification[NOTIFICATION_MODEL_PK_FIELD]
          }
        ],
        query: `SELECT * FROM m WHERE m.${NOTIFICATION_MODEL_PK_FIELD} = @partitionKey`
      })
      .fold(
        _ => fail("Result must be a right path"),
        maybeResult =>
          maybeResult.foldL(
            () => fail("Result must be some"),
            result =>
              expect(result).toMatchObject({
                ...aNotification,
                kind: "IRetrievedNotification"
              })
          )
      )
      .run();
  });
  it("should upsert a Notification", async () => {
    await model.create(aNewEmailNotification).run();
    await model
      .upsert({
        ...aNewEmailNotification,
        channels: {}
      })
      .fold(
        _ => fail(failRightPath),
        result =>
          expect(result).toMatchObject({
            ...aNotification,
            channels: {},
            kind: "IRetrievedNotification"
          })
      )
      .run();
  });
  it("should return a 409 error while trying to insert an existing document", async () => {
    await model.create(aNewEmailNotification).run();
    const errorOrResult = await model
      .create({
        ...aNewEmailNotification
      })
      .run();
    errorOrResult.fold(
      error => {
        expect(error.kind).toEqual("COSMOS_ERROR_RESPONSE");
        if (error.kind === "COSMOS_ERROR_RESPONSE") {
          expect(error.error.code).toEqual(409);
        }
      },
      _ => fail("No valid result is expected")
    );
  });

  it("should return none if no message was found", async () => {
    await model
      .findOneByQuery({
        parameters: [
          {
            name: "@partitionKey",
            value: anotherMessageId
          }
        ],
        query: `SELECT * FROM m WHERE m.${NOTIFICATION_MODEL_PK_FIELD} = @partitionKey`
      })
      .fold(
        _ => fail(validResultExpected),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });

  it("should return a notification for the given messageId", async () => {
    await model.create(aNewEmailNotification).run();
    await model
      .findNotificationForMessage(aMessageId)
      .fold(
        _ => fail(validResultExpected),
        maybeResult => expect(isSome(maybeResult)).toBeTruthy()
      )
      .run();
  });

  it("should return none if a notification does not exists for the given messageId", async () => {
    await model.create(aNewEmailNotification).run();
    await model
      .findNotificationForMessage(anotherMessageId)
      .fold(
        _ => fail(validResultExpected),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });
});
