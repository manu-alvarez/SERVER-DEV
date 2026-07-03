export interface MSBrossConfig {
  apiBase: string
  NIKOLINA_SERVER: string
  LIVEKIT_URL: string
}

declare global {
  interface Window {
    __MSBROSS_CONFIG__?: Partial<MSBrossConfig>
  }
}
