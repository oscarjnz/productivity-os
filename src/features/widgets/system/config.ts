export interface SystemConfig {
  /** Polling interval seconds. */
  pollSeconds: number;
}

export const defaultSystemConfig: SystemConfig = {
  pollSeconds: 5,
};
