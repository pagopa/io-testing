import { toError } from "fp-ts/lib/Either";
import {
  SERVICE_COLLECTION_NAME,
  SERVICE_MODEL_PK_FIELD,
  ServiceModel
} from "io-functions-commons/dist/src/models/service";
import { withoutUndefinedValues } from "italia-ts-commons/lib/types";
import {
  aNewService,
  anotherServiceId,
  aRetrievedService,
  aService,
  aServiceId
} from "../../../../__mocks__/mock";
import {
  ioFunctionsAppBasePath,
  ioFunctionsAppHost
} from "../../../utils/api-props";
import { clearAllTestData } from "../../../utils/clear_data";
import { retrievedServiceToPublic } from "../../../utils/conversions";
import { database } from "../../../utils/cosmosdb";
import { fetchFromApi } from "../../../utils/fetch";

const container = database.container(SERVICE_COLLECTION_NAME);
const model = new ServiceModel(container);

const failRightPath = "Result must be a right path";

const getServiceEndpoint = `${ioFunctionsAppHost}${ioFunctionsAppBasePath}/services/`;
afterEach(async () => {
  await clearAllTestData(
    container,
    model,
    aService,
    SERVICE_MODEL_PK_FIELD
  ).run();
});

describe("GetService", () => {
  it("should get an existing Service", async () => {
    await model
      .create(aNewService)
      .foldTaskEither(
        err => fail(`${failRightPath}|${toError(err).message}`),
        () => fetchFromApi(`${getServiceEndpoint}${aServiceId}`, {})
      )
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject(
            withoutUndefinedValues(retrievedServiceToPublic(aRetrievedService))
          );
        }
      )
      .run();
  });

  it("should return 404 if no profile was found", async () => {
    await fetchFromApi(`${getServiceEndpoint}${anotherServiceId}`, {})
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(404);
          expect(responseInfo.body.title).toEqual("Service not found");
        }
      )
      .run();
  });
});
