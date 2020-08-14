import { format } from "date-fns";
import { IPString } from "italia-ts-commons/lib/strings";
import { aDate, aFiscalCode } from "../../../../__mocks__/mock";
import {
  blobService,
  getQueueClient,
  publishQueueMessage,
  spidMsgQueueName,
  tGetBlobAsObject
} from "../../../utils/azure_storage";
import { clearAllBlobData } from "../../../utils/clear_data";
import { base64EncodeObject } from "../../../utils/encode";
import { SpidMsgItem } from "../../../utils/types";

const failRightPath = "Result must be a right path";

const aSpidMsgItem: SpidMsgItem = {
  createdAt: aDate,
  createdAtDay: format(aDate, "YYYY-MM-DD"),
  fiscalCode: aFiscalCode,
  ip: "192.168.1.6" as IPString,
  requestPayload:
    "<?xml version='1.0' encoding='UTF-8'?><note ID='AAAA_BBBB'><to>Azure</to><from>Azure</from><heading>Reminder</heading><body>New append from local dev - REQUEST</body></note>",
  responsePayload:
    "<?xml version='1.0' encoding='UTF-8'?><note ID='AAAA_BBBB'><to>Azure</to><from>Azure</from><heading>Reminder</heading><body>New append from local dev - RESPONSE</body></note>",
  spidRequestId: "AAAA_BBBB"
};

const SPID_CONTAINER_NAME = "spidassertions";

afterEach(async () => {
  await clearAllBlobData(
    blobService,
    SPID_CONTAINER_NAME,
    `${aSpidMsgItem.spidRequestId}-${aSpidMsgItem.createdAtDay}-${aFiscalCode}.json`
  ).run();
});

describe("StoreSpidLogs", () => {
  it("should publish a spid Message to correct queue and write a blob", async () => {
    const queueClient = getQueueClient(spidMsgQueueName);
    await publishQueueMessage(
      queueClient,
      base64EncodeObject(aSpidMsgItem)
    ).run();
    await tGetBlobAsObject(
      SPID_CONTAINER_NAME,
      `${aSpidMsgItem.spidRequestId}-${aSpidMsgItem.createdAtDay}-${aFiscalCode}.json`
    )
      .fold(
        _ => fail(failRightPath),
        blob => {
          expect(blob).toBeDefined();
          expect(blob.spidRequestId).toEqual(aSpidMsgItem.spidRequestId);
        }
      )
      .run();
  });
});
