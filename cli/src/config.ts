import { Config, isValidConfig } from "./types";
import { homedir } from "os";
import fs from "node:fs";

const configPath = `${homedir()}/.toad/config`;

const load = (): Config => {
  let config: Config | undefined;

  try {
    config = JSON.parse(fs.readFileSync(configPath).toString());
  } catch (e) {
    console.error(`toad must be configured first by running 'toad setup'`);
    process.exit(1);
  }

  if (!isValidConfig(config)) {
    console.error("Invalid config. Please run 'toad setup' again");
    process.exit(1);
  }

  return config;
};

const save = (config: Config) => {
  const dir = configPath.split("/").slice(0, -1).join("/");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(configPath, JSON.stringify(config));
};

const update = (fn: (prev: Config) => Config) => {
  const config = load();

  if (!isValidConfig(config)) {
    console.error("Invalid config");
    process.exit(1);
  }

  const cfg = fn(config);

  save(cfg);
};

export default { load, save, update };
