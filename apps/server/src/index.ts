import { conf } from "./conf.js";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { bearerAuth } from "hono/bearer-auth";
import { listProjects, toadProjectsDir } from "./utils.js";
import fs from "node:fs/promises";
import fse from "fs-extra";
import os from "node:os";
import tar from "tar";
import path from "node:path";
import { ProcessManager } from "./pm.js";
import { IToadConfig } from "./types.js";
import * as cp from "node:child_process";

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

  return c.json({ ok: true, message: process.status });
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

  const installCmd = config.commands?.install ?? "pnpm install";
  cp.execSync(installCmd, { cwd: projectDir, env: config.env });
  console.log("Installed");

  const buildCmd = config.commands?.build ?? "pnpm build";
  cp.execSync(buildCmd, { cwd: projectDir, env: config.env });
  console.log("Built");

  const [startCmd, ...startArgs] = (
    config.commands?.start ?? "pnpm start"
  ).split(" ");

  console.log("Starting", startCmd, startArgs);

  const process = await pm.start(projectName, startCmd, startArgs, {
    cwd: projectDir,
    env: config.env,
  });

  console.log("Started!");

  return c.json({ ok: true, message: "Uploaded", process });
});

serve(app, (info) =>
  console.info(`Server listening on ${info.address}:${info.port}`)
);

export type AppType = typeof app;
