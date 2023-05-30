import { describe, beforeAll, it, assert, expect } from "vitest";
import { ProcessManager } from "../src/pm.js";
import { Redis } from "ioredis";

describe("ProcessManager", () => {
  let processManager: ProcessManager;
  let redis: Redis;

  beforeAll(async () => {
    processManager = new ProcessManager();
    redis = new Redis({
      host: "vps.sunney.dev",
      password: "Sani1234@rs",
      db: 1,
    });

    await redis.flushdb();
  });

  it("should start a process", async () => {
    const process = await processManager.startProcess("test", "echo", [
      "hello",
    ]);
    const processes = await redis.hgetall("processes");

    assert(processes[process.id] !== undefined);
  });

  it("should stop a process", async () => {
    const process = await processManager.startProcess("test", "sleep", ["500"]);
    console.log(process);
    await processManager.stopProcess(process.id);
    const processes = await redis.hgetall("processes");

    const stoppedProcess = JSON.parse(processes[process.id]);

    expect(stoppedProcess.status).toBe("stopped");
  });
});
