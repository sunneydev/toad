import crypto from "node:crypto";
import os from "node:os";
import * as fs from "node:fs/promises";

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const toadProjectsDir = `${os.homedir()}/toad-projects`;

export async function listProjects() {
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
      .readFile(`${projectDir}/toad.json`)
      .catch(() => "{}");

    const projectConfigJson = JSON.parse(projectConfig.toString());

    return {
      name,
      config: projectConfigJson,
    };
  });

  const projects = await Promise.all(promises);

  return projects;
}
