import { Container } from "@azure/cosmos";
import { BlobService } from "azure-storage";
import { array, rights } from "fp-ts/lib/Array";
import { taskEither, taskify, tryCatch } from "fp-ts/lib/TaskEither";
import * as asyncI from "io-functions-commons/dist/src/utils/async";
import { toCosmosErrorResponse } from "io-functions-commons/dist/src/utils/cosmosdb_model";
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
