export interface SpotifyConfig {
  /** Spotify app Client ID from developer.spotify.com. */
  clientId: string;
}

export const defaultSpotifyConfig: SpotifyConfig = {
  clientId: "",
};

export const SPOTIFY_SCOPES = "user-read-currently-playing user-read-playback-state";
export const SPOTIFY_TOKEN_META_KEY = "spotify.tokens";
export const SPOTIFY_PKCE_SESSION_KEY = "spotify.pkce";
