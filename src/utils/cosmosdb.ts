import { CosmosClient } from "@azure/cosmos";
import { getRequiredStringEnv } from "io-functions-commons/dist/src/utils/env";

const cosmosDbUri = getRequiredStringEnv("COSMOSDB_URI");

const masterKey = getRequiredStringEnv("COSMOSDB_KEY");

const dbName = getRequiredStringEnv("COSMOSDB_NAME");

export const cosmosdbClient = new CosmosClient({
  endpoint: cosmosDbUri as string,
  key: masterKey as string
});

export const database = cosmosdbClient.database(dbName as string);
