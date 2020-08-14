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
  aNewMessageWithoutContent,
  anotherFiscalCode,
  anotherNewMessageWithoutContent,
  anotherRetrievedMessage,
  aRetrievedMessage,
  aSerializedNewMessageWithoutContent
} from "../../../../__mocks__/mock";
import {
  ioFunctionsAppBasePath,
  ioFunctionsAppHost
} from "../../../utils/api_props";
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
  ).run();
  await clearAllBlobData(
    blobService,
    MESSAGE_CONTAINER_NAME,
    `${aSerializedNewMessageWithoutContent.id}.json`
  ).run();
});

describe("GetMessages", () => {
  it("should get a list of existing Messages by providing a fiscalCode", async () => {
    await model
      .create(aNewMessageWithoutContent)
      .chain(_ => model.create(anotherNewMessageWithoutContent))
      .foldTaskEither(
        err => fail(`${failRightPath}|${toError(err).message}`),
        () => fetchFromApi(`${getMessageEndpoint}${aFiscalCode}`, {})
      )
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject({
            items: [
              {
                ...retrievedMessageToPublic(aRetrievedMessage),
                created_at: aRetrievedMessage.createdAt.toISOString()
              },
              {
                ...retrievedMessageToPublic(anotherRetrievedMessage),
                created_at: anotherRetrievedMessage.createdAt.toISOString()
              }
            ]
          });
        }
      )
      .run();
  });

  it("should return empty items array if no message was found", async () => {
    await fetchFromApi(`${getMessageEndpoint}${anotherFiscalCode}`, {})
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject({
            items: []
          });
        }
      )
      .run();
  });
});
