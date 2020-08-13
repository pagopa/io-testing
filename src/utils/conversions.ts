import {
  NewProfile,
  RetrievedProfile
} from "io-functions-commons/dist/src/models/profile";

import { ExtendedProfile } from "io-functions-commons/dist/generated/definitions/ExtendedProfile";

import {
  NotificationChannel,
  NotificationChannelEnum
} from "io-functions-commons/dist/generated/definitions/NotificationChannel";
import { ServicePublic } from "io-functions-commons/dist/generated/definitions/ServicePublic";
import { RetrievedService } from "io-functions-commons/dist/src/models/service";

import { UserDataProcessing } from "io-functions-commons/dist/generated/definitions/UserDataProcessing";
import { RetrievedUserDataProcessing } from "io-functions-commons/dist/src/models/user_data_processing";
import { withoutUndefinedValues } from "italia-ts-commons/lib/types";
import { NewProfile as NewProfileApi } from "../../generated/io-fn-app/NewProfile";
import { Profile as ProfileApi } from "../../generated/io-fn-app/Profile";

export function retrievedProfileToExtendedProfile(
  profile: RetrievedProfile
): ExtendedProfile {
  return {
    accepted_tos_version: profile.acceptedTosVersion,
    blocked_inbox_or_channels: profile.blockedInboxOrChannels,
    email: profile.email,
    is_email_enabled: profile.isEmailEnabled !== false,
    is_email_validated: profile.isEmailValidated !== false,
    is_inbox_enabled: profile.isInboxEnabled === true,
    is_test_profile: profile.isTestProfile === true,
    is_webhook_enabled: profile.isWebhookEnabled === true,
    preferred_languages: profile.preferredLanguages,
    version: profile.version
  };
}

export function serviceAvailableNotificationChannels(
  retrievedService: RetrievedService
): ReadonlyArray<NotificationChannel> {
  if (retrievedService.requireSecureChannels) {
    return [NotificationChannelEnum.WEBHOOK];
  }
  return [NotificationChannelEnum.EMAIL, NotificationChannelEnum.WEBHOOK];
}

export function retrievedServiceToPublic(
  retrievedService: RetrievedService
): ServicePublic {
  return {
    available_notification_channels: serviceAvailableNotificationChannels(
      retrievedService
    ),
    department_name: retrievedService.departmentName,
    organization_fiscal_code: retrievedService.organizationFiscalCode,
    organization_name: retrievedService.organizationName,
    service_id: retrievedService.serviceId,
    service_metadata: retrievedService.serviceMetadata && {
      address: retrievedService.serviceMetadata.address,
      app_android: retrievedService.serviceMetadata.appAndroid,
      app_ios: retrievedService.serviceMetadata.appIos,
      description: retrievedService.serviceMetadata.description,
      email: retrievedService.serviceMetadata.email,
      pec: retrievedService.serviceMetadata.pec,
      phone: retrievedService.serviceMetadata.phone,
      privacy_url: retrievedService.serviceMetadata.privacyUrl,
      scope: retrievedService.serviceMetadata.scope,
      tos_url: retrievedService.serviceMetadata.tosUrl,
      web_url: retrievedService.serviceMetadata.webUrl
    },
    service_name: retrievedService.serviceName,
    version: retrievedService.version
  };
}

/**
 * Converts a RetrievedUserDataProcessing model to an UserDataProcessing
 */
export function toUserDataProcessingApi(
  userDataProcessing: RetrievedUserDataProcessing
): UserDataProcessing {
  return {
    choice: userDataProcessing.choice,
    created_at: userDataProcessing.createdAt,
    status: userDataProcessing.status,
    updated_at: userDataProcessing.updatedAt,
    version: userDataProcessing.version
  };
}

export function profileToNewProfileApi(newProfile: NewProfile): NewProfileApi {
  return {
    email: newProfile.email,
    is_email_validated: true,
    is_test_profile: newProfile.isTestProfile
  };
}

export function retrievedProfileToProfileApi(
  retrievedProfile: RetrievedProfile
): ProfileApi {
  return {
    accepted_tos_version: retrievedProfile.acceptedTosVersion,
    blocked_inbox_or_channels: retrievedProfile.blockedInboxOrChannels,
    email: retrievedProfile.email,
    is_email_enabled: retrievedProfile.isEmailEnabled,
    is_inbox_enabled: retrievedProfile.isInboxEnabled,
    version: retrievedProfile.version
  };
}

// tslint:disable-next-line: no-any
export function withoutMetadataProperties(retrievedDocument: any): any {
  return withoutUndefinedValues({
    ...retrievedDocument,
    _etag: undefined,
    _rid: undefined,
    _self: undefined,
    _ts: undefined
  });
}
