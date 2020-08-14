import { getRequiredStringEnv } from "io-functions-commons/dist/src/utils/env";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

export const ioFunctionsAppHost: NonEmptyString = getRequiredStringEnv(
  "IO_FUNCTIONS_APP_HOST"
);

export const ioFunctionsAppBasePath: NonEmptyString = getRequiredStringEnv(
  "IO_FUNCTIONS_APP_BASE_PATH"
);
