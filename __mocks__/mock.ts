import { EmailAddress } from "io-functions-commons/dist/generated/definitions/EmailAddress";
import { MaxAllowedPaymentAmount } from "io-functions-commons/dist/generated/definitions/MaxAllowedPaymentAmount";
import { MessageBodyMarkdown } from "io-functions-commons/dist/generated/definitions/MessageBodyMarkdown";
import { MessageContent } from "io-functions-commons/dist/generated/definitions/MessageContent";
import { MessageStatusValueEnum } from "io-functions-commons/dist/generated/definitions/MessageStatusValue";
import { MessageSubject } from "io-functions-commons/dist/generated/definitions/MessageSubject";
import { NotificationChannelEnum } from "io-functions-commons/dist/generated/definitions/NotificationChannel";
import { NotificationChannelStatusValueEnum } from "io-functions-commons/dist/generated/definitions/NotificationChannelStatusValue";
import { ServiceId } from "io-functions-commons/dist/generated/definitions/ServiceId";
import { TimeToLiveSeconds } from "io-functions-commons/dist/generated/definitions/TimeToLiveSeconds";
import { UserDataProcessingChoiceEnum } from "io-functions-commons/dist/generated/definitions/UserDataProcessingChoice";
import { UserDataProcessingStatusEnum } from "io-functions-commons/dist/generated/definitions/UserDataProcessingStatus";
import {
  NewMessageWithoutContent,
  RetrievedMessageWithoutContent
} from "io-functions-commons/dist/src/models/message";
import { NewMessageStatus } from "io-functions-commons/dist/src/models/message_status";
import {
  NewNotification,
  NotificationAddressSourceEnum
} from "io-functions-commons/dist/src/models/notification";
import {
  NewNotificationStatus,
  NotificationStatusId
} from "io-functions-commons/dist/src/models/notification_status";
import {
  NewProfile,
  Profile,
  RetrievedProfile
} from "io-functions-commons/dist/src/models/profile";
import {
  NewService,
  RetrievedService,
  Service,
  toAuthorizedCIDRs,
  toAuthorizedRecipients
} from "io-functions-commons/dist/src/models/service";
import {
  makeUserDataProcessingId,
  NewUserDataProcessing,
  RetrievedUserDataProcessing
} from "io-functions-commons/dist/src/models/user_data_processing";
import { VisibleService } from "io-functions-commons/dist/src/models/visible_service";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import {
  EmailString,
  FiscalCode,
  NonEmptyString,
  OrganizationFiscalCode
} from "italia-ts-commons/lib/strings";

export const aFiscalCode = "DROLSS85S20H501F" as FiscalCode;
export const anotherFiscalCode = "DROLSS85S20H501H" as FiscalCode;
export const aDate = new Date();
export const retrievedMetadata = {
  _etag: "aaa",
  _rid: "xyz",
  _self: "xyz",
  _ts: 1
};

export const aUserDataProcessingChoice = UserDataProcessingChoiceEnum.DOWNLOAD;
export const aUserDataProcessingStatus = UserDataProcessingStatusEnum.PENDING;
export const aUserDataProcessingId = makeUserDataProcessingId(
  aUserDataProcessingChoice,
  aFiscalCode
);

export const aUserDataProcessing = {
  choice: aUserDataProcessingChoice,
  createdAt: aDate,
  fiscalCode: aFiscalCode,
  status: aUserDataProcessingStatus
};

export const aNewUserDataProcessing: NewUserDataProcessing = {
  ...aUserDataProcessing,
  kind: "INewUserDataProcessing",
  userDataProcessingId: aUserDataProcessingId
};

export const aRetrievedUserDataProcessing: RetrievedUserDataProcessing = {
  ...aUserDataProcessing,
  ...retrievedMetadata,
  id: `${aUserDataProcessingId}-0000000000000000` as NonEmptyString,
  kind: "IRetrievedUserDataProcessing",
  userDataProcessingId: aUserDataProcessingId,
  version: 0 as NonNegativeInteger
};

export const aNotificationStatusId = "A_NOTIFICATION_ID:EMAIL" as NotificationStatusId;
export const aNotificationId = "A_NOTIFICATION_ID" as NonEmptyString;
export const aSerializedNotificationStatus = {
  channel: NotificationChannelEnum.EMAIL,
  messageId: "A_MESSAGE_ID" as NonEmptyString,
  notificationId: aNotificationId,
  status: NotificationChannelStatusValueEnum.SENT,
  statusId: aNotificationStatusId,
  updatedAt: aDate
};

export const aNewNotificationStatus: NewNotificationStatus = {
  ...aSerializedNotificationStatus,
  kind: "INewNotificationStatus"
};

export const aMessageId = "A_MESSAGE_ID" as NonEmptyString;
export const anotherMessageId = "ANOTHER_MESSAGE_ID" as NonEmptyString;

export const aNotification = {
  channels: {
    [NotificationChannelEnum.EMAIL]: {
      addressSource: NotificationAddressSourceEnum.DEFAULT_ADDRESS,
      toAddress: "to@example.com" as EmailAddress
    }
  },
  fiscalCode: aFiscalCode,
  messageId: aMessageId
};

export const aNewEmailNotification: NewNotification = {
  ...aNotification,
  id: "A_NOTIFICATION_ID" as NonEmptyString,
  kind: "INewNotification"
};

export const aSimpleProfile = {
  email: "test@mail.it" as EmailString,
  fiscalCode: aFiscalCode,
  isInboxEnabled: false
};

export const aProfile: Profile = {
  acceptedTosVersion: 1,
  ...aSimpleProfile
};

export const aNewProfile: NewProfile = {
  ...aProfile,
  kind: "INewProfile"
};

export const aRetrievedProfile: RetrievedProfile = {
  ...aProfile,
  ...retrievedMetadata,
  id: `${aFiscalCode}-0000000000000000` as NonEmptyString,
  kind: "IRetrievedProfile",
  version: 0 as NonNegativeInteger
};

export const aSimpleRetrievedProfile: RetrievedProfile = {
  ...aSimpleProfile,
  ...retrievedMetadata,
  id: `${aFiscalCode}-0000000000000000` as NonEmptyString,
  kind: "IRetrievedProfile",
  version: 0 as NonNegativeInteger
};

export const aServiceId = "xyz" as NonEmptyString;
export const anotherServiceId = "abc" as NonEmptyString;
export const anOrganizationFiscalCode = "01234567890" as OrganizationFiscalCode;

export const aService: Service = {
  authorizedCIDRs: toAuthorizedCIDRs([]),
  authorizedRecipients: toAuthorizedRecipients([]),
  departmentName: "MyDept" as NonEmptyString,
  isVisible: true,
  maxAllowedPaymentAmount: 0 as MaxAllowedPaymentAmount,
  organizationFiscalCode: anOrganizationFiscalCode,
  organizationName: "MyOrg" as NonEmptyString,
  requireSecureChannels: false,
  serviceId: aServiceId,
  serviceName: "MyService" as NonEmptyString
};

export const aNewService: NewService = {
  ...aService,
  kind: "INewService"
};

export const aRetrievedService: RetrievedService = {
  ...aService,
  ...retrievedMetadata,
  id: `${aFiscalCode}-0000000000000000` as NonEmptyString,
  kind: "IRetrievedService",
  version: 0 as NonNegativeInteger
};

export const aVisibleService: VisibleService = {
  ...aService,
  id: `${aFiscalCode}-0000000000000000` as NonEmptyString,
  version: 0 as NonNegativeInteger
};

export const aSerializedNewMessageWithoutContent = {
  createdAt: aDate,
  fiscalCode: aFiscalCode,
  id: aMessageId,
  indexedId: "A_MESSAGE_ID" as NonEmptyString,
  senderServiceId: "agid" as ServiceId,
  senderUserId: "u123" as NonEmptyString,
  timeToLiveSeconds: 3600 as TimeToLiveSeconds
};

export const aNewMessageWithoutContent: NewMessageWithoutContent = {
  ...aSerializedNewMessageWithoutContent,
  createdAt: aDate,
  kind: "INewMessageWithoutContent"
};

export const aRetrievedMessage: RetrievedMessageWithoutContent = {
  ...aSerializedNewMessageWithoutContent,
  ...retrievedMetadata,
  kind: "IRetrievedMessageWithoutContent"
};

export const anotherSerializedNewMessageWithoutContent = {
  createdAt: aDate,
  fiscalCode: aFiscalCode,
  id: anotherMessageId,
  indexedId: "ANOTHER_MESSAGE_ID" as NonEmptyString,
  senderServiceId: "agid" as ServiceId,
  senderUserId: "u123" as NonEmptyString,
  timeToLiveSeconds: 3600 as TimeToLiveSeconds
};

export const anotherNewMessageWithoutContent: NewMessageWithoutContent = {
  ...anotherSerializedNewMessageWithoutContent,
  createdAt: aDate,
  kind: "INewMessageWithoutContent"
};

export const anotherRetrievedMessage: RetrievedMessageWithoutContent = {
  ...anotherSerializedNewMessageWithoutContent,
  ...retrievedMetadata,
  kind: "IRetrievedMessageWithoutContent"
};

export const aMessageBodyMarkdown = "test".repeat(80) as MessageBodyMarkdown;

export const aMessageContent: MessageContent = {
  markdown: aMessageBodyMarkdown,
  subject: "test".repeat(10) as MessageSubject
};

export const aSerializedMessageStatus = {
  messageId: aMessageId,
  status: MessageStatusValueEnum.ACCEPTED,
  updatedAt: aDate
};

export const aNewMessageStatus: NewMessageStatus = {
  ...aSerializedMessageStatus,
  kind: "INewMessageStatus"
};
