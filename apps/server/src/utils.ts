import { IToadConfig } from "./types.js";
import { requests } from "@sunney/requests";
import crypto from "node:crypto";
import os from "node:os";
import * as fs from "node:fs/promises";
import path from "node:path";
import fse from "fs-extra";
import { ProcessManager } from "./pm.js";
import { execa } from "execa";
import tar from "tar";

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const toadProjectsDir = `${os.homedir()}/toad-projects`;

export async function extractProject(
  projectDir: string,
  projectBundle: ArrayBuffer
) {
  const tempDir = await fs.mkdtemp(`${os.tmpdir()}/.toad`);
  const tempPath = `${tempDir}/toad-project-${Date.now()}.tar.gz`;

  await fs.writeFile(tempPath, Buffer.from(projectBundle));

  if (fse.existsSync(projectDir)) {
    await fse.emptyDir(projectDir);
  } else {
    await fse.mkdir(projectDir, { recursive: true });
  }

  await tar.x({ file: tempPath, cwd: projectDir });

  await fs.rm(tempDir, { recursive: true, force: true });

  const config = (await fs
    .readFile(path.join(projectDir, "toad.config.json"), "utf-8")
    .then(JSON.parse)
    .catch(() => null)) as IToadConfig | null;

  if (!config) {
    throw new Error("Failed to read project config");
  }

  return config;
}

export async function setupProject(
  projectDir: string,
  projectBundle: ArrayBuffer
) {
  const config = await extractProject(projectDir, projectBundle);

  const [installCmd, ...installArgs] = (
    config.commands?.install || "pnpm install"
  ).split(" ");

  const install = await execa(installCmd, installArgs, {
    cwd: projectDir,
    env: config.env,
  }).catch((e) => e);
  if ("message" in install) {
    throw new Error("Failed to install project: " + install.message);
  }

  const [buildCmd, ...buildArgs] = (
    config.commands?.build || "pnpm build"
  ).split(" ");

  const build = await execa(buildCmd, buildArgs, {
    cwd: projectDir,
    env: config.env,
  }).catch((e) => e);
  if ("message" in build) {
    throw new Error("Failed to build project: " + build.message);
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

  return config;
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
