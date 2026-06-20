export interface HolyricsApiTarget {
  host: string;
  port: number;
  token: string;
}

export interface HolyricsApiRequestResult<T> {
  action: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  data: T;
}

export interface HolyricsTokenInfo {
  version: string;
  permissions: string;
}

export interface HolyricsVersionInfo {
  version: string;
  platform: string;
  platformDescription: string;
  baseDir?: string;
  language?: string;
  platformLanguage?: string;
  theme?: string;
  jscVersion?: string;
  ip_list?: string[];
}

export interface HolyricsApiServerInfo {
  enabled_local: boolean;
  enabled_web: boolean;
  port: number;
  ip_list: string[];
}

export interface HolyricsAuthenticationResult {
  connected: true;
  authenticated: true;
  version: string;
  permissions: string[];
  message: string;
  checkedAt: string;
}

export interface HolyricsInformationResult {
  connected: true;
  authenticated: true;
  version: string;
  platform: string;
  platformDescription: string;
  permissions: string[];
  apiServer: {
    enabledLocal: boolean;
    enabledWeb: boolean;
    port: number;
    ipList: string[];
  };
  message: string;
  checkedAt: string;
}

export interface HolyricsPermissionCheckResult {
  authenticated: true;
  authorized: true;
  actions: string[];
  message: string;
  checkedAt: string;
}

export interface HolyricsConnectionResult
  extends HolyricsInformationResult {
  latencyMs: number;
}
