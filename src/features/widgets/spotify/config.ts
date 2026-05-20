export interface SpotifyConfig {
  /** Spotify app Client ID from developer.spotify.com. */
  clientId: string;
}

export const defaultSpotifyConfig: SpotifyConfig = {
  clientId: "",
};

// Read scopes: see what's playing.
// Modify scope: prev / next / play / pause / seek.
export const SPOTIFY_SCOPES =
  "user-read-currently-playing user-read-playback-state user-modify-playback-state";
export const SPOTIFY_TOKEN_META_KEY = "spotify.tokens";
export const SPOTIFY_PKCE_SESSION_KEY = "spotify.pkce";
