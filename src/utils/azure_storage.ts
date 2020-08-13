// tslint:disable: no-any
import { QueueClient } from "@azure/storage-queue";
import { createBlobService } from "azure-storage";
import * as azure_storage from "azure-storage";
import { toError } from "fp-ts/lib/Either";
import { Option, tryCatch } from "fp-ts/lib/Option";
import {
  fromLeft,
  taskEither,
  TaskEither,
  tryCatch as tryCatchT
} from "fp-ts/lib/TaskEither";
import { fromEither } from "fp-ts/lib/TaskEither";
import {
  getBlobAsObject,
  upsertBlobFromObject
} from "io-functions-commons/dist/src/utils/azure_storage";
import { getRequiredStringEnv } from "io-functions-commons/dist/src/utils/env";
import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

const storageConnectionString = tryCatch(() =>
  getRequiredStringEnv("BlobStorageConnection")
).getOrElse(process.env.BlobStorageConnection as NonEmptyString);

export const spidMsgQueueName: NonEmptyString = tryCatch(() =>
  getRequiredStringEnv("SPID_LOG_QUEUE_NAME")
).getOrElse(process.env.SPID_LOG_QUEUE_NAME as NonEmptyString);

export const blobService = createBlobService(storageConnectionString);

export const tUpsertBlobFromObject = (
  containerName: string,
  blobName: string,
  content: any
): TaskEither<Error, Option<azure_storage.BlobService.BlobResult>> =>
  tryCatchT(
    () => upsertBlobFromObject(blobService, containerName, blobName, content),
    toError
  ).chain(_ =>
    _.fold(
      err => fromLeft(err),
      opt => taskEither.of(opt)
    )
  );

export const tGetBlobAsObject = (
  containerName: string,
  blobName: string
): TaskEither<Error, any> =>
  tryCatchT(
    () => getBlobAsObject(t.any, blobService, containerName, blobName),
    toError
  )
    .chain(errorOrMaybeString => fromEither(errorOrMaybeString))
    .chain(_ =>
      _.foldL(
        () => fromLeft(new Error("Blob not found")),
        result => taskEither.of(result)
      )
    );

export const getQueueClient = (queueName: string) => {
  return new QueueClient(storageConnectionString, queueName);
};

export const publishQueueMessage = (
  queueClient: QueueClient,
  message: string
) => tryCatchT(() => queueClient.sendMessage(message), toError);
