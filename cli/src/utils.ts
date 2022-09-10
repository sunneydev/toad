import type { Project, ToadYAML } from "./types";
import config from "./config";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { parse } from "yaml";

export function exit(message: string) {
  console.error(message);
  process.exit(1);
}

export function getGitRemoteURL() {
  const res = execSync("git config --get remote.origin.url");

  return res.toString().trim();
}

export function getCurrentProject(): Project | undefined {
  const cfg = config.load();
  const cwd = process.cwd();

  return cfg.projects?.find((p) => p.dir === cwd);
}

export function toadYAML(): ToadYAML {
  if (!fs.existsSync("toad.yml")) {
    console.error("Run 'toad init' first");
    process.exit(1);
  }

  try {
    const projectConfig = parse(
      fs.readFileSync("toad.yml").toString()
    ) as ToadYAML;

    if (!projectConfig.domain || !projectConfig.port) {
      console.error("toad.yml must contain a 'domain' and 'port' field");
      process.exit(1);
    }

    return projectConfig;
  } catch (e) {
    console.error("Invalid toad.yml");
    process.exit(1);
  }
}
