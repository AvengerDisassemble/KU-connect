export interface PrivacyConsent {
  dataProcessingConsent: boolean;
}

export const buildPrivacyConsentPayload = (
  consentGiven: boolean
): PrivacyConsent | undefined => {
  return consentGiven ? { dataProcessingConsent: true } : undefined;
};
