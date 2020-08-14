import { CosmosClient } from "@azure/cosmos";
import * as https from "https";
import { getRequiredStringEnv } from "io-functions-commons/dist/src/utils/env";

const cosmosDbUri = getRequiredStringEnv("COSMOSDB_URI");

const masterKey = getRequiredStringEnv("COSMOSDB_KEY");

const dbName = getRequiredStringEnv("COSMOSDB_NAME");

const tlsRejectUnauthorized = getRequiredStringEnv(
  "NODE_TLS_REJECT_UNAUTHORIZED"
);

export const cosmosdbClient = new CosmosClient({
  agent: new https.Agent({
    rejectUnauthorized: tlsRejectUnauthorized !== "0"
  }),
  endpoint: cosmosDbUri as string,
  key: masterKey as string
});

export const database = cosmosdbClient.database(dbName as string);
