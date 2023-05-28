export interface SetupRequest {
  token: string;
  domain: string;
}
export interface Commands {
  start?: string;
  build?: string;
  install?: string;
}

export interface IToadConfig {
  name?: string;
  commands?: Commands;
  appDomain?: string;
  env?: Record<string, string>;
}

export interface ToadProject {
  name: string;
}
