import pm2, { StartOptions } from "pm2";
import { config } from "./config.js";
import { promises as fs } from "node:fs";
import { getProjectDirectories } from "./utils.js";
import { spawn, spawnSync } from "node:child_process";

export default class ProcessManager {
  constructor() {
    pm2.connect((err) => {
      if (err) {
        console.error(err);
        process.exit(2);
      }
    });

    this._loadProcesses();
  }

  private async _loadProcesses() {
    const projects = await getProjectDirectories(config.projectsPath);

    for (const project of projects) {
      const [name, owner] = project.split("/").reverse();

      await this.addProcess(`${owner}/${name}`, "npm", {
        args: ["run", "start"],
        cwd: project,
      });
    }
  }

  async addProcess(
    name: string,
    script: string,
    options: StartOptions = {}
  ): Promise<void> {
    const existingProcesses = await this.listProcesses();

    if (existingProcesses.find((ep) => ep.active && ep.name === name)) {
      console.log(`Process with name ${name} already exists!`);
      return;
    }

    spawnSync("pnpm", ["install"], {
      cwd: options.cwd,
    }).output.forEach((o) => console.log(o?.toString()));

    return new Promise((resolve, reject) => {
      pm2.start({ name, script, ...options }, (err, apps) => {
        if (err) {
          console.error(`Error starting process: ${err.message}`);
          reject(err);
        } else {
          console.log(`Started process with name: ${name}`);
          resolve();
        }
      });
    });
  }

  async removeProcess(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      pm2.delete(name, (err) => {
        if (err) {
          console.error(`Error stopping process: ${err.message}`);
          reject(err);
        } else {
          console.log(`Stopped process with name: ${name}`);
          resolve();
        }
      });
    });
  }

  async listProcesses(): Promise<
    {
      name: string;
      pid: number;
      active?: boolean;
    }[]
  > {
    return new Promise((resolve, reject) => {
      pm2.list((err, processDescriptionList) => {
        if (err) {
          console.error(`Error listing processes: ${err.message}`);
          reject(err);
        } else {
          resolve(
            processDescriptionList
              .filter((pl) => pl.name)
              .map((processDescription) => ({
                name: processDescription.name,
                pid: processDescription.pid,
                active: processDescription.pm2_env?.status === "online",
              })) as {
              name: string;
              pid: number;
            }[]
          );
        }
      });
    });
  }
}
