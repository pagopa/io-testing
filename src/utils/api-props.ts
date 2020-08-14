import { tryCatch } from "fp-ts/lib/Option";
import { getRequiredStringEnv } from "io-functions-commons/dist/src/utils/env";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

export const ioFunctionsAppHost: NonEmptyString = tryCatch(() =>
  getRequiredStringEnv("IO_FUNCTIONS_APP_HOST")
).getOrElse(process.env.IO_FUNCTIONS_APP_HOST as NonEmptyString);

export const ioFunctionsAppBasePath: NonEmptyString = tryCatch(() =>
  getRequiredStringEnv("IO_FUNCTIONS_APP_BASE_PATH")
).getOrElse(process.env.IO_FUNCTIONS_APP_BASE_PATH as NonEmptyString);

export const mailHogHost: NonEmptyString = tryCatch(() =>
  getRequiredStringEnv("MAILHOG_HOST")
).getOrElse(process.env.MAILHOG_HOST as NonEmptyString);

export const mailHogSearchApiEndpoint: NonEmptyString = tryCatch(() =>
  getRequiredStringEnv("MAILHOG_API_ENDPOINT")
).getOrElse(process.env.MAIL_HOG_API_ENDPOINT as NonEmptyString);

export const mailHogPort: NonEmptyString = tryCatch(() =>
  getRequiredStringEnv("MAILHOG_PORT")
).getOrElse(process.env.MAILHOG_PORT as NonEmptyString);
