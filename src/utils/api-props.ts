import { tryCatch } from "fp-ts/lib/Option";
import { getRequiredStringEnv } from "io-functions-commons/dist/src/utils/env";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

export const ioFunctionsAppHost: NonEmptyString = tryCatch(() =>
  getRequiredStringEnv("IO_FUNCTIONS_APP_HOST")
).getOrElse(process.env.IO_FUNCTIONS_APP_HOST as NonEmptyString);

export const ioFunctionsAppBasePath: NonEmptyString = tryCatch(() =>
  getRequiredStringEnv("IO_FUNCTIONS_APP_BASE_PATH")
).getOrElse(process.env.IO_FUNCTIONS_APP_BASE_PATH as NonEmptyString);
