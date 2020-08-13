import {
  USER_DATA_PROCESSING_COLLECTION_NAME,
  USER_DATA_PROCESSING_MODEL_PK_FIELD,
  UserDataProcessingModel
} from "io-functions-commons/dist/src/models/user_data_processing";
import { withoutUndefinedValues } from "italia-ts-commons/lib/types";
import {
  aFiscalCode,
  aNewUserDataProcessing,
  anotherFiscalCode,
  aRetrievedUserDataProcessing,
  aUserDataProcessing,
  aUserDataProcessingChoice
} from "../../../../__mocks__/mock";
import {
  ioFunctionsAppBasePath,
  ioFunctionsAppHost
} from "../../../utils/api-props";
import { clearAllTestData } from "../../../utils/clear_data";
import { toUserDataProcessingApi } from "../../../utils/conversions";
import { database } from "../../../utils/cosmosdb";
import { fetchFromApi } from "../../../utils/fetch";

const container = database.container(USER_DATA_PROCESSING_COLLECTION_NAME);
const model = new UserDataProcessingModel(container);

const failRightPath = "Result must be a right path";

const getUserDataProcessingEndpoint = `${ioFunctionsAppHost}${ioFunctionsAppBasePath}/user-data-processing/`;
afterEach(async () => {
  await clearAllTestData(
    container,
    model,
    aUserDataProcessing,
    USER_DATA_PROCESSING_MODEL_PK_FIELD
  ).run();
});

describe("GetUserDataProcessing", () => {
  it("should get an existing userDataProcessing", async () => {
    await model
      .create(aNewUserDataProcessing)
      .foldTaskEither(
        () => fail(failRightPath),
        () =>
          fetchFromApi(
            `${getUserDataProcessingEndpoint}${aFiscalCode}/${aUserDataProcessingChoice}`,
            {}
          )
      )
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(200);
          expect(responseInfo.body).toMatchObject(
            withoutUndefinedValues({
              ...toUserDataProcessingApi(aRetrievedUserDataProcessing),
              created_at: aRetrievedUserDataProcessing.createdAt.toISOString()
            })
          );
        }
      )
      .run();
  });

  it("should return 404 if no userDataProcessing was found", async () => {
    await fetchFromApi(
      `${getUserDataProcessingEndpoint}${anotherFiscalCode}/${aUserDataProcessingChoice}`,
      {}
    )
      .fold(
        _ => fail(failRightPath),
        responseInfo => {
          expect(responseInfo.statusCode).toBe(404);
        }
      )
      .run();
  });
});
