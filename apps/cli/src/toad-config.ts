import { Commands, IToadConfig } from "shared/types.js";
import fs from "node:fs";

export class ToadConfig implements IToadConfig {
  private baseDirectory: string;
  name: string | undefined;
  commands?: Commands;
  appDomain?: string | undefined;
  env?: Record<string, string> | undefined;

  exists = false;

  constructor(baseDirectory: string, name?: string) {
    this.baseDirectory = baseDirectory;
    this.name = undefined;
    this.commands = {};
    this.appDomain = undefined;
    this.env = undefined;
    this.load();
  }

  async save(config: IToadConfig) {
    this.name = config.name;
    this.commands = config.commands;
    this.appDomain = config.appDomain;
    this.env = config.env;

    return fs.promises.writeFile(
      `${this.baseDirectory}/toad.config.json`,
      JSON.stringify(config)
    );
  }

  load() {
    try {
      const config = fs.readFileSync(`${this.baseDirectory}/toad.config.json`);
      const parsedConfig = JSON.parse(config.toString());
      this.exists = true;

      this.name = parsedConfig.name;
      this.commands = parsedConfig.commands;
      this.appDomain = parsedConfig.appDomain;
      this.env = parsedConfig.env;
    } catch (e) {
      this.exists = false;
    }
  }
}