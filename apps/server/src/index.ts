import { conf } from "./conf.js";
import { $ } from "execa";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { bearerAuth } from "hono/bearer-auth";
import {
  addCaddyConfig,
  getCaddyConfig,
  listProjects,
  toadProjectsDir,
} from "./utils.js";
import fs from "node:fs/promises";
import fse from "fs-extra";
import os from "node:os";
import tar from "tar";
import path from "node:path";
import { ProcessManager } from "./pm.js";
import { IToadConfig } from "./types.js";

const pm = new ProcessManager();
const app = new Hono().basePath("/api");

app.use("/*", bearerAuth({ token: conf.get("token") }));

app.get("/auth", async (c) => {
  return c.json({ ok: true, message: "Authenticated" });
});

app.get("/projects", async (c) => {
  const projects = await listProjects(pm);

  return c.json(projects);
});

app.post("/start/:name", async (c) => {
  const projectName = c.req.param("name");

  const projectDir = path.join(toadProjectsDir, projectName);

  const projectConfig = (await fs
    .readFile(path.join(projectDir, "toad.config.json"), "utf-8")
    .then(JSON.parse)
    .catch((err) => {
      console.error(err);
      return null;
    })) as IToadConfig;

  const process = await pm.get(projectName);

  if (process?.status === "running") {
    return c.json({ ok: false, message: "Project already running" });
  }

  const [startCmd, ...startArgs] = projectConfig.commands?.start?.split(
    " "
  ) ?? ["pnpm", "start"];

  await pm.start(projectName, startCmd, startArgs, {
    env: projectConfig.env,
    cwd: projectDir,
  });

  return c.json({ ok: true, message: "Started" });
});

app.post("/stop/:name", async (c) => {
  const projectName = c.req.param("name");

  const process = await pm.get(projectName);

  if (!process) {
    return c.json({ ok: false, message: "Project not running" });
  }

  await pm.stop(projectName);

  return c.json({ ok: true, message: "Stopped" });
});

app.get("/status/:name", async (c) => {
  const projectName = c.req.param("name");

  const process = await pm.get(projectName);

  if (!process) {
    return c.json({ ok: false, message: "Project process does not exist" });
  }

  return c.json({
    ok: true,
    message: `Project ${projectName} is ${process.status}`,
  });
});

app.post("/up/:name", async (c) => {
  const projectName = c.req.param("name");
  const projectBundle = await c.req.arrayBuffer();

  const tempDir = await fs.mkdtemp(`${os.tmpdir()}/.toad`);
  const tempPath = `${tempDir}/toad-project-${Date.now()}.tar.gz`;

  await fs.writeFile(tempPath, Buffer.from(projectBundle));

  const projectDir = path.join(toadProjectsDir, projectName);

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
    return c.json({ ok: false, message: "Invalid project" });
  }

  const $$ = $({ cwd: projectDir, env: config.env });

  const {
    install: installCmd = "pnpm install",
    build: buildCmd = "pnpm build",
    start: startCmd = "pnpm start",
  } = config.commands ?? {};

  const install = await $$`${installCmd}`;
  if (install.failed) {
    return c.json({
      ok: false,
      message: "Failed to install dependencies",
      error: install.all,
    });
  }

  const build = await $$`${buildCmd}`;
  if (build.failed) {
    return c.json({
      ok: false,
      message: "Failed to build project",
      error: build.all,
    });
  }

  if (config.appDomain) {
    const { appDomain } = config;
    const port = Number(config.env?.PORT);

    if (typeof port !== "number") {
      return c.json({
        ok: false,
        message: "PORT environment variable is required when using appDomain",
      });
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

  const process = await pm.get(projectName);

  if (process?.status === "running") {
    await pm.stop(projectName);
  }

  const [startCmdInitial, ...startArgs] = startCmd.split(" ");

  try {
    await pm.start(projectName, startCmdInitial, startArgs, {
      env: config.env,
      cwd: projectDir,
    });
  } catch (err) {
    return c.json({
      ok: false,
      message: "Failed to start project",
      error: err instanceof Error ? err.message : JSON.stringify(err),
    });
  }

  return c.json({ ok: true, message: "Started" });
});

serve({ ...app, port: conf.get("port") }, (info) =>
  console.info(`Server listening on ${info.address}:${info.port}`)
);

export type AppType = typeof app;
