import type { ServerConfig } from "./types";
import { homedir } from "os";
import { promisify } from "util";
import { exec } from "child_process";
import fs from "node:fs";
import os from "node:os";

const configPath = `${homedir()}/.toad/srv-config`;

export function loadConfig(): ServerConfig | undefined {
  try {
    const cfg = JSON.parse(
      fs.readFileSync(configPath).toString()
    ) as ServerConfig;

    if (!cfg.token) return;

    cfg.dir = cfg.dir || os.homedir() + "/projects";
    cfg.port = cfg.port || 3535;

    saveConfig(cfg);

    return cfg;
  } catch (e) {
    return;
  }
}

export function mkdir(path: string) {
  const dir = path.split("/").slice(0, -1).join("/");
  !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true });
}

export function saveConfig(cfg: ServerConfig) {
  mkdir(configPath);
  fs.writeFileSync(configPath, JSON.stringify(cfg));
}

export const execa = promisify(exec);
