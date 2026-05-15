export interface GmailConfig {
  maxThreads: number;
  /** Gmail search query for the list. */
  query: string;
}

export const defaultGmailConfig: GmailConfig = {
  maxThreads: 8,
  query: "is:unread in:inbox",
};
