import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { bearerAuth } from "hono/bearer-auth";
import { conf } from "./conf.js";
import { listProjects } from "./utils.js";
import fs from "node:fs/promises";
import os from "node:os";
import tar from "tar";

const app = new Hono().basePath("/api");

app.use("/*", bearerAuth({ token: conf.get("token") }));

app.get("/auth", async (c) => {
  return c.json({ ok: true, message: "Authenticated" });
});

app.get("/projects", async (c) => {
  const projects = listProjects();

  return c.json(projects);
});

app.post("/up", async (c) => {
  const projectBundle = await c.req.arrayBuffer();

  const tempDir = await fs.mkdtemp(`${os.tmpdir()}/.toad`);
  const tempPath = `${tempDir}/toad-project-${Date.now()}.tar.gz`;

  await fs.writeFile(tempPath, Buffer.from(projectBundle));

  await tar.x({
    file: tempPath,
    cwd: tempDir,
  });

  return c.json({ ok: true, message: "Uploaded" });
});

serve(app, (info) =>
  console.info(`Server listening on ${info.address}:${info.port}`)
);

export type AppType = typeof app;
