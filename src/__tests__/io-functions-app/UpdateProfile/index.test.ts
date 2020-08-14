import {
  PROFILE_COLLECTION_NAME,
  PROFILE_MODEL_PK_FIELD,
  ProfileModel
} from "io-functions-commons/dist/src/models/profile";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { EmailString, NonEmptyString } from "italia-ts-commons/lib/strings";
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
  ioFunctionsAppHost,
  mailHogHost,
  mailHogPort,
  mailHogSearchApiEndpoint
} from "../../../utils/api_props";
import { clearAllTestData, clearEmails } from "../../../utils/clear_data";
import {
  retrievedProfileToExtendedProfile,
  retrievedProfileToProfileApi,
  withoutMetadataProperties
} from "../../../utils/conversions";
import { database } from "../../../utils/cosmosdb";
import { fetchFromApi } from "../../../utils/fetch";

const container = database.container(PROFILE_COLLECTION_NAME);
const model = new ProfileModel(container);

const failRightPath = "Result must be a right path";

const getProfileEndpoint = `${ioFunctionsAppHost}${ioFunctionsAppBasePath}/profiles/`;
const anUpdatedEmail = "updated-email@mail.it" as EmailString;
const mailSearchEndpoint = `${mailHogHost}:${mailHogPort}/${mailHogSearchApiEndpoint}/?kind=to;`;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

afterEach(async () => {
  await clearAllTestData(
    container,
    model,
    aProfile,
    PROFILE_MODEL_PK_FIELD
  ).run();
  await clearEmails().run();
});

describe("UpdateProfile", () => {
  it("should update an existing Profile", async () => {
    await model.create(aNewProfile).run();
    const req = {
      body: JSON.stringify(
        retrievedProfileToProfileApi({
          ...aRetrievedProfile,
          email: anUpdatedEmail
        })
      ),
      method: "put"
    };
    await fetchFromApi(`${getProfileEndpoint}${aFiscalCode}`, req)
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject(
            withoutUndefinedValues(
              retrievedProfileToExtendedProfile({
                ...aRetrievedProfile,
                email: anUpdatedEmail,
                version: 1 as NonNegativeInteger
              })
            )
          );
        }
      )
      .run();
    // check if updated profile exists on database
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
                withoutMetadataProperties({
                  ...aRetrievedProfile,
                  email: anUpdatedEmail,
                  id: `${aFiscalCode}-0000000000000001` as NonEmptyString,
                  version: 1 as NonNegativeInteger
                })
              )
          )
      )
      .run();
    // wait for orchestrator to call send mail activity
    await delay(2000);
    await fetchFromApi(`${mailSearchEndpoint}query=${anUpdatedEmail}`, {})
      .fold(
        _ => fail(failRightPath),
        res => {
          expect(res.statusCode).toBe(200);
          expect(res.body.count).toBeGreaterThan(0);
        }
      )
      .run();
  });

  it("should return 400 if profile does not match Profile type", async () => {
    const req = {
      body: JSON.stringify({}),
      method: "put"
    };
    await fetchFromApi(`${getProfileEndpoint}${aFiscalCode}`, req)
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(400);
          expect(responseInfo.body.title).toEqual("Invalid Exact<Profile>");
        }
      )
      .run();
  });

  it("should return 404 if a profile does not exists for the given fiscalCode", async () => {
    const req = {
      body: JSON.stringify(
        retrievedProfileToProfileApi({
          ...aRetrievedProfile,
          email: anUpdatedEmail
        })
      ),
      method: "put"
    };
    await fetchFromApi(`${getProfileEndpoint}${anotherFiscalCode}`, req)
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(404);
        }
      )
      .run();
  });

  it("should return 409 if a profile version is not the last version", async () => {
    await model.create(aNewProfile).run();
    const req = {
      body: JSON.stringify(
        retrievedProfileToProfileApi({
          ...aRetrievedProfile,
          email: anUpdatedEmail,
          version: 3 as NonNegativeInteger
        })
      ),
      method: "put"
    };
    await fetchFromApi(`${getProfileEndpoint}${aFiscalCode}`, req)
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
