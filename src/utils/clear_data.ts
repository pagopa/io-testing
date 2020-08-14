import { Container } from "@azure/cosmos";
import { BlobService } from "azure-storage";
import { array, rights } from "fp-ts/lib/Array";
import { fromLeft, taskEither, taskify, tryCatch } from "fp-ts/lib/TaskEither";
import * as asyncI from "io-functions-commons/dist/src/utils/async";
import { toCosmosErrorResponse } from "io-functions-commons/dist/src/utils/cosmosdb_model";
import { mailHogApiV1Endpoint, mailHogHost, mailHogPort } from "./api_props";
import { fetchFromApi } from "./fetch";
// tslint:disable: no-any

export const clearAllTestData = (
  container: Container,
  model: any,
  modelInstance: any,
  modelPkField: string
) =>
  tryCatch(
    () =>
      asyncI.asyncIterableToArray(
        asyncI.flattenAsyncIterable(
          model.getQueryIterator({
            parameters: [
              {
                name: "@partitionKey",
                value: modelInstance[modelPkField]
              }
            ],
            query: `SELECT * FROM m WHERE m.${modelPkField} = @partitionKey`
          })
        )
      ),
    toCosmosErrorResponse
  ).chain((documents: readonly any[]) =>
    array.sequence(taskEither)(
      rights([...documents]).map((doc: any) =>
        tryCatch(
          () => container.item(doc.id, doc[modelPkField]).delete(),
          toCosmosErrorResponse
        ).map(_ => _.item.id)
      )
    )
  );

export const clearAllBlobData = (
  blobService: BlobService,
  container: string,
  blob: string
) => {
  return taskify(cb => blobService.deleteBlobIfExists(container, blob, cb))();
};

export const clearEmails = () => {
  const url = `${mailHogHost}:${mailHogPort}/${mailHogApiV1Endpoint}/messages`;
  return fetchFromApi(url, { method: "delete" }).chain(res =>
    res.statusCode === 200
      ? taskEither.of(res.statusCode)
      : fromLeft(new Error("Cannot delete emails"))
  );
};
