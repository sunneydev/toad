export interface SetupRequest {
  token: string;
  domain: string;
}

export type ApiResponse =
  | string
  | {
      ok: boolean;
      message: string;
      error?: string;
    };

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

export interface Process {
  name: string;
  command: string;
  status: "running" | "stopped";
  pid: string;
}

export interface ToadProject {
  name: string;
  config: IToadConfig;
  process: Process | null;
}
