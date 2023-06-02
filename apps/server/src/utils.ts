import { IToadConfig } from "./types.js";
import { requests } from "@sunney/requests";
import crypto from "node:crypto";
import os from "node:os";
import * as fs from "node:fs/promises";
import fse from "fs-extra/esm";
import { ProcessManager } from "./pm.js";

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const toadProjectsDir = `${os.homedir()}/toad-projects`;

export async function listProjects(pm: ProcessManager) {
  if (fse.pathExistsSync(toadProjectsDir) === false) {
    return [];
  }

  const projectNames = await fs.readdir(toadProjectsDir);

  const promises = projectNames.map(async (name) => {
    const isDir = await fs
      .lstat(`${toadProjectsDir}/${name}`)
      .then((s) => s.isDirectory());

    if (!isDir) {
      return null;
    }

    const projectDir = `${toadProjectsDir}/${name}`;
    const projectConfig = await fs
      .readFile(`${projectDir}/toad.config.json`)
      .catch(() => "null");

    const projectConfigJson = JSON.parse(
      projectConfig.toString()
    ) as IToadConfig | null;

    const process = await pm.get(name);

    return {
      name,
      config: projectConfigJson,
      process,
    };
  });

  const projects = await Promise.all(promises);

  return projects;
}

export async function addCaddyConfig(domain: string, port: number) {
  const config = {
    match: [{ host: [domain] }],
    handle: [
      {
        handler: "reverse_proxy",
        upstreams: [{ dial: `127.0.0.1:${port}` }],
      },
    ],
  };

  await requests.post(
    "http://localhost:2019/config/apps/http/servers/srv0/routes",
    { body: config }
  );
}

export async function getCaddyConfig() {
  return requests.get(
    "http://localhost:2019/config/apps/http/servers/srv0/routes"
  );
}
