import { IToadConfig } from "./types.js";
import { requests } from "@sunney/requests";
import crypto from "node:crypto";
import os from "node:os";
import * as fs from "node:fs/promises";
import fse from "fs-extra/esm";
import { ProcessManager } from "./pm.js";
import { $ } from "execa";

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const toadProjectsDir = `${os.homedir()}/toad-projects`;

export async function setupProject(projectDir: string, config: IToadConfig) {
  const $$ = $({ cwd: projectDir, env: config.env });

  const {
    install: installCmd = "pnpm install",
    build: buildCmd = "pnpm build",
  } = config.commands ?? {};

  const install = await $$`${installCmd}`.catch((e) => e);
  if (install.failed) {
    throw new Error("Failed to install project: " + install.stderr);
  }

  const build = await $$`${buildCmd}`.catch((e) => e);
  if (build.failed) {
    throw new Error("Failed to build project: " + build.stderr);
  }

  if (config.appDomain) {
    const { appDomain } = config;
    const port = Number(config.env?.PORT);

    if (typeof port !== "number") {
      throw new Error(
        "PORT environment variable is required when using appDomain"
      );
    }

    const caddyConfig = await getCaddyConfig().then((r) => r.data?.toString());

    if (
      !caddyConfig?.includes(`"${appDomain}"`) &&
      !caddyConfig?.includes(`"127.0.0.1:${port}"`)
    ) {
      await addCaddyConfig(appDomain, port);
    } else {
      console.log("Caddy config already exists");
    }
  }
}

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
