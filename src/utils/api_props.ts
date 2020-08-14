import { getRequiredStringEnv } from "io-functions-commons/dist/src/utils/env";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

export const ioFunctionsAppHost: NonEmptyString = getRequiredStringEnv(
  "IO_FUNCTIONS_APP_HOST"
);

export const ioFunctionsAppBasePath: NonEmptyString = getRequiredStringEnv(
  "IO_FUNCTIONS_APP_BASE_PATH"
);

export const mailHogHost: NonEmptyString = getRequiredStringEnv("MAILHOG_HOST");

export const mailHogSearchApiEndpoint: NonEmptyString = getRequiredStringEnv(
  "MAILHOG_APIV2_SEARCH_ENDPOINT"
);

export const mailHogPort: NonEmptyString = getRequiredStringEnv("MAILHOG_PORT");

export const mailHogApiV1Endpoint: NonEmptyString = getRequiredStringEnv(
  "MAILHOG_APIV1_ENDPOINT"
);
