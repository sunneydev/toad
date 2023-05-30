import { Redis } from "ioredis";
import findProcess from "find-process";
import { spawn, type SpawnOptions } from "child_process";
import { Process } from "./types.js";
import { conf } from "./conf.js";

export class ProcessManager {
  private redis: Redis;

  constructor() {
    const redisHost = conf.get("redis_host");
    const redisPort = conf.get("redis_port");
    const redisPassword = conf.get("redis_password");

    if (!redisHost) {
      throw new Error("Redis host not set");
    }

    this.redis = new Redis({
      host: redisHost,
      password: redisPassword,
      port: redisPort,
    });

    this._retrieveProcesses();
    this._watchProcesses();
  }

  private async _retrieveProcesses() {
    const processes = await this.redis.hgetall("processes");

    for (const id in processes) {
      this.redis.set(id, JSON.stringify(processes[id]));
    }
  }

  private async _watchProcesses() {
    const processes = await this.redis.hgetall("processes");

    for (const id in processes) {
      const process: Process = JSON.parse(processes[id]);
      const foundProcess = await findProcess("pid", process.pid);

      if (foundProcess.length === 0) {
        process.status = "stopped";
        await this.redis.hset("processes", id, JSON.stringify(process));
      }
    }
  }

  private _startProcess(
    command: string,
    args?: string[],
    options?: SpawnOptions
  ): string {
    const child = spawn(command, args ?? [], {
      detached: true,
      stdio: "ignore",
      ...options,
    });

    child.on("exit", (code) => {
      console.log(`Child process exited with code ${code}`);
    });

    child.unref();

    if (!child.pid) {
      throw new Error("Failed to start process");
    }

    return child.pid.toString();
  }

  private _stopProcess(pid: string) {
    const pn = parseInt(pid);
    process.kill(pn);
  }

  async start(
    name: string,
    command: string,
    args?: string[],
    options?: SpawnOptions
  ): Promise<Process> {
    const pid = this._startProcess(command, args, options);

    const process: Process = {
      name,
      command: `${command} ${args?.join(" ")}`,
      status: "running",
      pid,
    };

    await this.redis.hset("processes", name, JSON.stringify(process));

    return process;
  }

  async stop(name: string) {
    const processString = await this.redis.hget("processes", name);

    if (!processString) {
      throw new Error("Process not found");
    }

    const process: Process = JSON.parse(processString);

    try {
      this._stopProcess(process.pid);
    } catch (err) {
      console.log(
        `Failed to stop process ${name} with pid ${process.pid}. The process may have already stopped.`
      );
    }

    process.status = "stopped";

    await this.redis.hset("processes", name, JSON.stringify(process));
  }

  async get(name: string): Promise<Process | null> {
    const processString = await this.redis.hget("processes", name);

    return JSON.parse(processString ?? "null");
  }

  async getProcesses(): Promise<Process[]> {
    const processes = await this.redis.hgetall("processes");
    return Object.values(processes).map((processString) =>
      JSON.parse(processString)
    );
  }
}
