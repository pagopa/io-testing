import { toError } from "fp-ts/lib/Either";
import {
  VISIBLE_SERVICE_BLOB_ID,
  VISIBLE_SERVICE_CONTAINER
} from "io-functions-commons/dist/src/models/visible_service";
import { aServiceId, aVisibleService } from "../../../../__mocks__/mock";
import {
  ioFunctionsAppBasePath,
  ioFunctionsAppHost
} from "../../../utils/api_props";
import {
  blobService,
  tUpsertBlobFromObject
} from "../../../utils/azure_storage";
import { clearAllBlobData } from "../../../utils/clear_data";
import { fetchFromApi } from "../../../utils/fetch";

const failRightPath = "Result must be a right path";

const getVisibleServicesEndpoint = `${ioFunctionsAppHost}${ioFunctionsAppBasePath}/services/`;
afterEach(async () => {
  await clearAllBlobData(
    blobService,
    VISIBLE_SERVICE_CONTAINER,
    VISIBLE_SERVICE_BLOB_ID
  ).run();
});

describe("GetVisibleServices", () => {
  it("should get a list of Visible Services", async () => {
    await tUpsertBlobFromObject(
      VISIBLE_SERVICE_CONTAINER,
      VISIBLE_SERVICE_BLOB_ID,
      { [aServiceId]: aVisibleService }
    )
      .foldTaskEither(
        err => fail(`${failRightPath}|${toError(err).message}`),
        () => fetchFromApi(`${getVisibleServicesEndpoint}`, {})
      )
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body.items).toMatchObject([
            {
              scope: "NATIONAL",
              service_id: aVisibleService.serviceId,
              version: aVisibleService.version
            }
          ]);
        }
      )
      .run();
  });
});
