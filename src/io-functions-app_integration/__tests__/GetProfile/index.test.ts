import {
  PROFILE_COLLECTION_NAME,
  PROFILE_MODEL_PK_FIELD,
  ProfileModel
} from "io-functions-commons/dist/src/models/profile";
import { withoutUndefinedValues } from "italia-ts-commons/lib/types";
import {
  aFiscalCode,
  aNewProfile,
  anotherFiscalCode,
  aProfile,
  aRetrievedProfile
} from "../../../../__mocks__/mock";
import {
  ioFunctionsAppBasePath,
  ioFunctionsAppHost
} from "../../../utils/api-props";
import { clearAllTestData } from "../../../utils/clear_data";
import { retrievedProfileToExtendedProfile } from "../../../utils/conversions";
import { database } from "../../../utils/cosmosdb";
import { fetchFromApi } from "../../../utils/fetch";

const container = database.container(PROFILE_COLLECTION_NAME);
const model = new ProfileModel(container);

const failRightPath = "Result must be a right path";

const getProfileEndpoint = `${ioFunctionsAppHost}${ioFunctionsAppBasePath}/profiles/`;
afterEach(async () => {
  await clearAllTestData(
    container,
    model,
    aProfile,
    PROFILE_MODEL_PK_FIELD
  ).run();
});

describe("GetProfile", () => {
  it("should get an existing Profile", async () => {
    await model
      .create(aNewProfile)
      .foldTaskEither(
        () => fail(failRightPath),
        () => fetchFromApi(`${getProfileEndpoint}${aFiscalCode}`, {})
      )
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject(
            withoutUndefinedValues(
              retrievedProfileToExtendedProfile(aRetrievedProfile)
            )
          );
        }
      )
      .run();
  });

  it("should return 404 if no profile was found", async () => {
    const headers = {};
    await fetchFromApi(`${getProfileEndpoint}${anotherFiscalCode}`, { headers })
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(404);
          expect(responseInfo.body.title).toEqual("Profile not found");
        }
      )
      .run();
  });
});
