import { toError } from "fp-ts/lib/Either";
import {
  MESSAGE_COLLECTION_NAME,
  MESSAGE_MODEL_PK_FIELD,
  MessageModel
} from "io-functions-commons/dist/src/models/message";
import { retrievedMessageToPublic } from "io-functions-commons/dist/src/utils/messages";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import {
  aFiscalCode,
  aMessageContent,
  aMessageId,
  aNewMessageWithoutContent,
  aRetrievedMessage,
  aSerializedNewMessageWithoutContent
} from "../../../../__mocks__/mock";
import {
  ioFunctionsAppBasePath,
  ioFunctionsAppHost
} from "../../../utils/api-props";
import { blobService } from "../../../utils/azure_storage";
import { clearAllBlobData, clearAllTestData } from "../../../utils/clear_data";
import { database } from "../../../utils/cosmosdb";
import { fetchFromApi } from "../../../utils/fetch";

const MESSAGE_CONTAINER_NAME = "message-content" as NonEmptyString;
const container = database.container(MESSAGE_COLLECTION_NAME);
const model = new MessageModel(container, MESSAGE_CONTAINER_NAME);

const failRightPath = "Result must be a right path";
const getMessageEndpoint = `${ioFunctionsAppHost}${ioFunctionsAppBasePath}/messages/`;
afterEach(async () => {
  await clearAllTestData(
    container,
    model,
    aSerializedNewMessageWithoutContent,
    MESSAGE_MODEL_PK_FIELD
  )
    .foldTaskEither(
      err => fail(`Cannot delete test data|${toError(err).message}`),
      () =>
        clearAllBlobData(
          blobService,
          MESSAGE_CONTAINER_NAME,
          `${aSerializedNewMessageWithoutContent.id}.json`
        )
    )
    .run();
});

describe("GetMessage", () => {
  it("should get an existing Message", async () => {
    await model
      .create(aNewMessageWithoutContent)
      .foldTaskEither(
        err => fail(`${failRightPath}|${toError(err).message}`),
        () =>
          model.storeContentAsBlob(
            blobService,
            aNewMessageWithoutContent.id,
            aMessageContent
          )
      )
      .foldTaskEither(
        err => fail(`${failRightPath}|${toError(err).message}`),
        () =>
          fetchFromApi(`${getMessageEndpoint}${aFiscalCode}/${aMessageId}`, {})
      )
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject({
            message: {
              ...retrievedMessageToPublic(aRetrievedMessage),
              created_at: aRetrievedMessage.createdAt.toISOString()
            }
          });
        }
      )
      .run();
  });

  it("should return 404 if no message was found", async () => {
    await fetchFromApi(
      `${getMessageEndpoint}${aFiscalCode}/A_FAKE_MESSAGE_ID`,
      {}
    )
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(404);
          expect(responseInfo.body.title).toEqual("Message not found");
        }
      )
      .run();
  });
});
