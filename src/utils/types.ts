import * as t from "io-ts";
import { UTCISODateFromString } from "italia-ts-commons/lib/dates";
import { IPString, PatternString } from "italia-ts-commons/lib/strings";

const SpidMsgItem = t.intersection([
  t.interface({
    // Timestamp of Request/Response creation
    createdAt: UTCISODateFromString,

    // Date of the SPID request / response in YYYY-MM-DD format
    createdAtDay: PatternString("^[0-9]{4}-[0-9]{2}-[0-9]{2}$"),

    // IP of the client that made a SPID login action
    ip: IPString,

    // XML payload of the SPID Request
    requestPayload: t.string,

    // XML payload of the SPID Response
    responsePayload: t.string,

    // SPID request ID
    spidRequestId: t.string
  }),
  t.partial({
    // SPID user fiscal code
    fiscalCode: t.string
  })
]);

export type SpidMsgItem = t.TypeOf<typeof SpidMsgItem>;
