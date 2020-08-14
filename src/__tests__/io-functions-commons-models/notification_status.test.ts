import { isNone, isSome } from "fp-ts/lib/Option";
import { NotificationChannelEnum } from "io-functions-commons/dist/generated/definitions/NotificationChannel";
import { NotificationChannelStatusValueEnum } from "io-functions-commons/dist/generated/definitions/NotificationChannelStatusValue";
import {
  NOTIFICATION_STATUS_COLLECTION_NAME,
  NOTIFICATION_STATUS_MODEL_PK_FIELD,
  NotificationStatusModel
} from "io-functions-commons/dist/src/models/notification_status";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import {
  aNewNotificationStatus,
  aNotificationId,
  aSerializedNotificationStatus
} from "../../../__mocks__/mock";
import { clearAllTestData } from "../../utils/clear_data";
import { database } from "../../utils/cosmosdb";

const container = database.container(NOTIFICATION_STATUS_COLLECTION_NAME);
const model = new NotificationStatusModel(container);

const failRightPath = "Result must be a right path";
const validResultExpected = "A valid result is expected";
afterEach(async () => {
  await clearAllTestData(
    container,
    model,
    aSerializedNotificationStatus,
    "notificationId"
  ).run();
});

describe("CRU Operations", () => {
  it("should create a new Notification Status", async () => {
    await model
      .create(aNewNotificationStatus)
      .fold(
        _ => fail(failRightPath),
        result => {
          expect(result).toMatchObject({
            ...aSerializedNotificationStatus,
            kind: "IRetrievedNotificationStatus"
          });
        }
      )
      .run();
  });
  it("should retrieve a Notification Status", async () => {
    await model.create(aNewNotificationStatus).run();
    await model
      .findOneByQuery({
        parameters: [
          {
            name: "@partitionKey",
            value:
              aSerializedNotificationStatus[NOTIFICATION_STATUS_MODEL_PK_FIELD]
          }
        ],
        query: `SELECT * FROM m WHERE m.${NOTIFICATION_STATUS_MODEL_PK_FIELD} = @partitionKey`
      })
      .fold(
        _ => fail("Result must be a right path"),
        maybeResult =>
          maybeResult.foldL(
            () => fail("Result must be some"),
            result =>
              expect(result).toMatchObject({
                ...aSerializedNotificationStatus,
                kind: "IRetrievedNotificationStatus"
              })
          )
      )
      .run();
  });
  it("should upsert a Notification Status", async () => {
    await model.create(aNewNotificationStatus).run();
    await model
      .upsert({
        ...aNewNotificationStatus,
        status: NotificationChannelStatusValueEnum.FAILED
      })
      .fold(
        _ => fail(failRightPath),
        result =>
          expect(result).toMatchObject({
            ...aSerializedNotificationStatus,
            kind: "IRetrievedNotificationStatus",
            status: NotificationChannelStatusValueEnum.FAILED
          })
      )
      .run();
  });
  it("should return a 409 error while trying to insert an existing document", async () => {
    await model.create(aNewNotificationStatus).run();
    const errorOrResult = await model
      .create({
        ...aNewNotificationStatus
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
            value: "AAA"
          }
        ],
        query: `SELECT * FROM m WHERE m.${NOTIFICATION_STATUS_MODEL_PK_FIELD} = @partitionKey`
      })
      .fold(
        _ => fail(validResultExpected),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });

  it("should return a notification status for the given notification channel", async () => {
    await model.create(aNewNotificationStatus).run();
    await model
      .findOneNotificationStatusByNotificationChannel(
        aNotificationId,
        NotificationChannelEnum.EMAIL
      )
      .fold(
        _ => fail(validResultExpected),
        maybeResult => expect(isSome(maybeResult)).toBeTruthy()
      )
      .run();
  });

  it("should return none if a notification does not exists for the given messageId", async () => {
    await model.create(aNewNotificationStatus).run();
    await model
      .findOneNotificationStatusByNotificationChannel(
        "ANOTHER_NOT_ID" as NonEmptyString,
        NotificationChannelEnum.EMAIL
      )
      .fold(
        _ => fail(validResultExpected),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });
});
