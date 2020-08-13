import { rights } from "fp-ts/lib/Array";
import { isLeft } from "fp-ts/lib/Either";
import { isNone, isSome } from "fp-ts/lib/Option";
import { tryCatch } from "fp-ts/lib/TaskEither";
import { ServiceId } from "io-functions-commons/dist/generated/definitions/ServiceId";
import {
  MESSAGE_COLLECTION_NAME,
  MESSAGE_MODEL_PK_FIELD,
  MessageModel
} from "io-functions-commons/dist/src/models/message";
import {
  asyncIteratorToArray,
  flattenAsyncIterator
} from "io-functions-commons/dist/src/utils/async";
import { toCosmosErrorResponse } from "io-functions-commons/dist/src/utils/cosmosdb_model";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import {
  aFiscalCode,
  aMessageContent,
  aNewMessageWithoutContent,
  anotherFiscalCode,
  aSerializedNewMessageWithoutContent
} from "../../../__mocks__/mock";
import { blobService } from "../../utils/azure_storage";
import { clearAllBlobData, clearAllTestData } from "../../utils/clear_data";
import { database } from "../../utils/cosmosdb";

const MESSAGE_CONTAINER_NAME = "message-content" as NonEmptyString;
const container = database.container(MESSAGE_COLLECTION_NAME);
const model = new MessageModel(container, MESSAGE_CONTAINER_NAME);

const failRightPath = "Result must be a right path";
const validResultExpected = "A valid result is expected";
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

describe("CRU Operations", () => {
  it("should create a new Message", async () => {
    await model
      .create(aNewMessageWithoutContent)
      .fold(
        _ => fail(failRightPath),
        result => {
          expect(result).toMatchObject({
            ...aSerializedNewMessageWithoutContent,
            kind: "IRetrievedMessageWithoutContent"
          });
        }
      )
      .run();
  });
  it("should retrieve a message", async () => {
    await model.create(aNewMessageWithoutContent).run();
    await model
      .findOneByQuery({
        parameters: [
          {
            name: "@partitionKey",
            value: aSerializedNewMessageWithoutContent[MESSAGE_MODEL_PK_FIELD]
          }
        ],
        query: `SELECT * FROM m WHERE m.${MESSAGE_MODEL_PK_FIELD} = @partitionKey`
      })
      .fold(
        _ => fail("Result must be a right path"),
        maybeResult =>
          maybeResult.foldL(
            () => fail("Result must be some"),
            result =>
              expect(result).toMatchObject({
                ...aSerializedNewMessageWithoutContent,
                kind: "IRetrievedMessageWithoutContent"
              })
          )
      )
      .run();
  });
  it("should upsert a Message", async () => {
    await model.create(aNewMessageWithoutContent).run();
    await model
      .upsert({
        ...aNewMessageWithoutContent,
        senderServiceId: "poste" as ServiceId
      })
      .fold(
        _ => fail(failRightPath),
        result =>
          expect(result).toMatchObject({
            ...aSerializedNewMessageWithoutContent,
            kind: "IRetrievedMessageWithoutContent",
            senderServiceId: "poste" as ServiceId
          })
      )
      .run();
  });
  it("should return a 409 error while trying to insert an existing document", async () => {
    await model.create(aNewMessageWithoutContent).run();
    const errorOrResult = await model
      .create({
        ...aNewMessageWithoutContent
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
            value: anotherFiscalCode
          }
        ],
        query: `SELECT * FROM m WHERE m.${MESSAGE_MODEL_PK_FIELD} = @partitionKey`
      })
      .fold(
        _ => fail(validResultExpected),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });

  it("should return a message with the given recipient", async () => {
    await model.create(aNewMessageWithoutContent).run();
    await model
      .findMessageForRecipient(
        aFiscalCode,
        aSerializedNewMessageWithoutContent.id
      )
      .fold(
        _ => fail(validResultExpected),
        maybeResult => expect(isSome(maybeResult)).toBeTruthy()
      )
      .run();
  });

  it("should return none if a message does not exists for the given recipient", async () => {
    await model
      .findMessageForRecipient(
        anotherFiscalCode,
        aSerializedNewMessageWithoutContent.id
      )
      .fold(
        _ => fail(validResultExpected),
        maybeResult => expect(isNone(maybeResult)).toBeTruthy()
      )
      .run();
  });

  it("should return an array with all messages for a given fiscal code", async () => {
    await model.create(aNewMessageWithoutContent).run();
    await model
      .upsert({
        ...aNewMessageWithoutContent,
        senderServiceId: "poste" as ServiceId
      })
      .run();
    await model
      .findMessages(aFiscalCode)
      .chain(iterator =>
        tryCatch(
          () => asyncIteratorToArray(flattenAsyncIterator(iterator)),
          toCosmosErrorResponse
        )
      )
      .fold(
        _ => fail(validResultExpected),
        results => {
          expect(results.some(isLeft)).toBeFalsy();
          expect(rights([...results])).toMatchObject([
            {
              ...aSerializedNewMessageWithoutContent,
              kind: "IRetrievedMessageWithoutContent",
              senderServiceId: "poste" as ServiceId
            }
          ]);
        }
      )
      .run();
  });

  it("should return an empty array if no message was found for a given fiscal code", async () => {
    await model
      .findMessages(anotherFiscalCode)
      .chain(iterator =>
        tryCatch(
          () => asyncIteratorToArray(flattenAsyncIterator(iterator)),
          toCosmosErrorResponse
        )
      )
      .fold(
        _ => fail(validResultExpected),
        results => {
          expect(results.some(isLeft)).toBeFalsy();
          expect(rights([...results])).toMatchObject([]);
        }
      )
      .run();
  });
});

describe("BlobStorage Operations", () => {
  it("should store a message content into a blob with a certain blobName", async () => {
    await model.create(aNewMessageWithoutContent).run();
    await model
      .storeContentAsBlob(
        blobService,
        aNewMessageWithoutContent.id,
        aMessageContent
      )
      .fold(
        _ => fail(validResultExpected),
        maybeBlobResult =>
          maybeBlobResult.foldL(
            () => fail(validResultExpected),
            blobResult => {
              expect(blobResult.name).toEqual(
                `${aNewMessageWithoutContent.id}.json`
              );
            }
          )
      )
      .run();
  });

  it("should retrieve a message content from a blob by a given message", async () => {
    await model.create(aNewMessageWithoutContent).run();
    await model
      .storeContentAsBlob(
        blobService,
        aNewMessageWithoutContent.id,
        aMessageContent
      )
      .run();
    await model
      .getContentFromBlob(blobService, aNewMessageWithoutContent.id)
      .fold(
        _ => fail(validResultExpected),
        maybeMessageContent =>
          maybeMessageContent.foldL(
            () => fail(validResultExpected),
            msgContent => {
              expect(msgContent).toEqual(aMessageContent);
            }
          )
      )
      .run();
  });
});
