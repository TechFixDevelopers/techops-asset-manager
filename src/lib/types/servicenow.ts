export interface SnowTicketData {
  callerLegajo: string;
  callerName: string;
  assignmentGroup: string;
  shortDescription: string;
  description: string;
  symptom: string;
  contactType: string;
  impact: string;
  urgency: string;
  category: string;
  zone: string;
  location: string;
}

export interface SnowApiResult {
  mode: 'api';
  incNumber: string;
  sysId: string;
}

export interface SnowClipboardResult {
  mode: 'clipboard';
  clipboardText: string;
  consoleScript: string;
  bookmarklet: string;
  snowUrl: string;
}

export type SnowResult = SnowApiResult | SnowClipboardResult;
