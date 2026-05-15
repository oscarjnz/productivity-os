export interface GitHubConfig {
  username: string;
  /** Max events to display. */
  limit: number;
}

export const defaultGitHubConfig: GitHubConfig = {
  username: "",
  limit: 10,
};
