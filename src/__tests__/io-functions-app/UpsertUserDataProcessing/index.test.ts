import { UserDataProcessingStatusEnum } from "io-functions-commons/dist/generated/definitions/UserDataProcessingStatus";
import {
  USER_DATA_PROCESSING_COLLECTION_NAME,
  USER_DATA_PROCESSING_MODEL_PK_FIELD,
  UserDataProcessingModel
} from "io-functions-commons/dist/src/models/user_data_processing";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { withoutUndefinedValues } from "italia-ts-commons/lib/types";
import {
  aFiscalCode,
  aNewUserDataProcessing,
  aRetrievedUserDataProcessing,
  aUserDataProcessing,
  aUserDataProcessingChoice,
  aUserDataProcessingId
} from "../../../../__mocks__/mock";
import {
  ioFunctionsAppBasePath,
  ioFunctionsAppHost
} from "../../../utils/api_props";
import { clearAllTestData } from "../../../utils/clear_data";
import {
  toUserDataProcessingApi,
  withoutMetadataProperties
} from "../../../utils/conversions";
import { database } from "../../../utils/cosmosdb";
import { fetchFromApi } from "../../../utils/fetch";

const container = database.container(USER_DATA_PROCESSING_COLLECTION_NAME);
const model = new UserDataProcessingModel(container);

const failRightPath = "Result must be a right path";

const getUserDataProcessingEndpoint = `${ioFunctionsAppHost}${ioFunctionsAppBasePath}/user-data-processing/`;
const aClosedUserDataProcessingStatus = UserDataProcessingStatusEnum.CLOSED;

afterEach(async () => {
  await clearAllTestData(
    container,
    model,
    aUserDataProcessing,
    USER_DATA_PROCESSING_MODEL_PK_FIELD
  ).run();
});

describe("UpsertUserDataProcessing", () => {
  it("should upsert a UserDataProcessing", async () => {
    const req = {
      body: JSON.stringify({ choice: aUserDataProcessingChoice }),
      method: "post"
    };
    await fetchFromApi(`${getUserDataProcessingEndpoint}${aFiscalCode}`, req)
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject(
            withoutUndefinedValues({
              ...toUserDataProcessingApi(aRetrievedUserDataProcessing),
              created_at: responseInfo.body.created_at
            })
          );
        }
      )
      .run();
    // check if user_data_processing exists on database
    await model
      .findLastVersionByModelId([aUserDataProcessingId, aFiscalCode])
      .fold(
        _ => fail(failRightPath),
        maybeLastVersion =>
          maybeLastVersion.foldL(
            () => fail(failRightPath),
            lastVersion =>
              expect(lastVersion).toMatchObject(
                // lastVersion contains real metadata values, so we remove them to check oher properties
                withoutMetadataProperties({
                  ...aRetrievedUserDataProcessing,
                  createdAt: lastVersion.createdAt
                })
              )
          )
      )
      .run();
  });

  it("should upsert a UserDataProcessing with PENDING status if there is an existing CLOSED request", async () => {
    await model
      .create({
        ...aNewUserDataProcessing,
        status: aClosedUserDataProcessingStatus
      })
      .run();
    const req = {
      body: JSON.stringify({ choice: aUserDataProcessingChoice }),
      method: "post"
    };
    await fetchFromApi(`${getUserDataProcessingEndpoint}${aFiscalCode}`, req)
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject(
            withoutUndefinedValues({
              ...toUserDataProcessingApi({
                ...aRetrievedUserDataProcessing,
                version: 1 as NonNegativeInteger
              }),
              created_at: responseInfo.body.created_at
            })
          );
        }
      )
      .run();
    // check if upserted user_data_processing exists on database
    await model
      .findLastVersionByModelId([aUserDataProcessingId, aFiscalCode])
      .fold(
        _ => fail(failRightPath),
        maybeLastVersion =>
          maybeLastVersion.foldL(
            () => fail(failRightPath),
            lastVersion =>
              expect(lastVersion).toMatchObject(
                // lastVersion contains real metadata values, so we remove them to check oher properties
                withoutMetadataProperties({
                  ...aRetrievedUserDataProcessing,
                  createdAt: lastVersion.createdAt,
                  id: lastVersion.id,
                  version: 1 as NonNegativeInteger
                })
              )
          )
      )
      .run();
  });

  it("should return 409 if a PENDING request already exists", async () => {
    await model.create(aNewUserDataProcessing).run();
    const req = {
      body: JSON.stringify({ choice: aUserDataProcessingChoice }),
      method: "post"
    };
    await fetchFromApi(`${getUserDataProcessingEndpoint}${aFiscalCode}`, req)
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(409);
          expect(responseInfo.body.title).toEqual("Conflict");
        }
      )
      .run();
  });

  it("should return 409 if a WIP request already exists", async () => {
    await model
      .create({
        ...aNewUserDataProcessing,
        status: UserDataProcessingStatusEnum.WIP
      })
      .run();
    const req = {
      body: JSON.stringify({ choice: aUserDataProcessingChoice }),
      method: "post"
    };
    await fetchFromApi(`${getUserDataProcessingEndpoint}${aFiscalCode}`, req)
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
