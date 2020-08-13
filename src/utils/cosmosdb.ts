import { CosmosClient } from "@azure/cosmos";

import { tryCatch } from "fp-ts/lib/Option";
import { getRequiredStringEnv } from "io-functions-commons/dist/src/utils/env";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

const cosmosDbUri = tryCatch(() =>
  getRequiredStringEnv("COSMOSDB_URI")
).getOrElse(process.env.COSMOSDB_URI as NonEmptyString);
const masterKey = tryCatch(() =>
  getRequiredStringEnv("COSMOSDB_KEY")
).getOrElse(process.env.COSMOSDB_KEY as NonEmptyString);
const dbName = tryCatch(() => getRequiredStringEnv("COSMOSDB_NAME")).getOrElse(
  process.env.COSMOSDB_NAME as NonEmptyString
);

export const cosmosdbClient = new CosmosClient({
  endpoint: cosmosDbUri as string,
  key: masterKey as string
});

export const database = cosmosdbClient.database(dbName as string);
