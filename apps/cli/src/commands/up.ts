import { api } from "../api.js";
import { ToadConfig } from "../toad-config.js";
import { promises as fs } from "node:fs";
import FormData from "form-data";
import tar from "tar";
import os from "node:os";

const ignored = [
  ".toad",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "__pycache__",
];

export async function up() {
  const projectDirectoryPath = process.cwd();

  const config = new ToadConfig(projectDirectoryPath);

  if (!config.exists) {
    throw new Error("Project not initialized, please run `toad init` first");
  }

  if (!config.name) {
    throw new Error("Project name not set, please run `toad init` first");
  }

  const tempDir = await fs.mkdtemp(`${os.tmpdir()}/.toad`);
  const tempPath = `${tempDir}/${config.name}-${Date.now()}.tar.gz`;

  await tar.c(
    {
      gzip: true,
      file: tempPath,
      cwd: projectDirectoryPath,
      filter: (p) => !ignored.some((i) => p.includes(i)),
    },
    ["."]
  );

  const file = await fs.readFile(tempPath);

  await api().post("/up", {
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });

  await fs.rm(tempDir, { recursive: true, force: true });
}
