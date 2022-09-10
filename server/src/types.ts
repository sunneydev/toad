export interface ServerConfig {
  port: number | string;
  token: string;
  dir: string;
}

export interface UpRequest {
  config: ToadYAML;
  project: Project;
}

export interface ToadYAML {
  install?: string;
  build?: string;
  start?: string;
  domain: string;
  port: number | string;
}

export interface Project {
  remote: string;
  dir: string;
  config: ToadYAML;
}

export interface Config {
  projects?: Project[];
  endpoint: string;
  token: string;
  https?: boolean;
}

export const isValidConfig = (config: any): config is Config => {
  return (
    config &&
    typeof config.endpoint === "string" &&
    typeof config.token === "string" &&
    config.endpoint.length > 0 &&
    config.token.length > 0
  );
};
