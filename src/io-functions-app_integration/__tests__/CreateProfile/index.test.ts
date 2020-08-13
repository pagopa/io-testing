import {
  PROFILE_COLLECTION_NAME,
  PROFILE_MODEL_PK_FIELD,
  ProfileModel
} from "io-functions-commons/dist/src/models/profile";
import { withoutUndefinedValues } from "italia-ts-commons/lib/types";
import {
  aFiscalCode,
  aNewProfile,
  aProfile,
  aSimpleRetrievedProfile
} from "../../../../__mocks__/mock";
import {
  ioFunctionsAppBasePath,
  ioFunctionsAppHost
} from "../../../utils/api-props";
import { clearAllTestData } from "../../../utils/clear_data";
import {
  profileToNewProfileApi,
  retrievedProfileToExtendedProfile,
  withoutMetadataProperties
} from "../../../utils/conversions";
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

describe("CreateProfile", () => {
  it("should create a new Profile", async () => {
    const req = {
      body: JSON.stringify(profileToNewProfileApi(aNewProfile)),
      method: "post"
    };
    await fetchFromApi(`${getProfileEndpoint}${aFiscalCode}`, req)
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject(
            withoutUndefinedValues(
              retrievedProfileToExtendedProfile(aSimpleRetrievedProfile)
            )
          );
        }
      )
      .run();
    // check if profile exists on database
    await model
      .findLastVersionByModelId([aFiscalCode])
      .fold(
        _ => fail(failRightPath),
        maybeLastVersion =>
          maybeLastVersion.foldL(
            () => fail(failRightPath),
            lastVersion =>
              expect(lastVersion).toMatchObject(
                // lastVersion contains real metadata values, so we remove them to check oher properties
                withoutMetadataProperties(aSimpleRetrievedProfile)
              )
          )
      )
      .run();
  });

  it("should return 409 conflict if a profile already exists", async () => {
    const req = {
      body: JSON.stringify(profileToNewProfileApi(aNewProfile)),
      method: "post"
    };
    await model
      .create(aNewProfile)
      .foldTaskEither(
        () => fail(failRightPath),
        () => fetchFromApi(`${getProfileEndpoint}${aFiscalCode}`, req)
      )
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(409);
          expect(responseInfo.body.title).toEqual("Conflict");
        }
      )
      .run();
  });
});
