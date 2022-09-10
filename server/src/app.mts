import type { ServerConfig, UpRequest } from "./types.js";
import type { Request, Response } from "express";
import express from "express";
import fs from "node:fs";
import { execa, mkdir } from "./utils";
import { exec } from "node:child_process";
import { cwd } from "node:process";

type Process = {
  pid: number;
  name: string;
  command: string;
};

let serverConfig: ServerConfig;
const runningProcesses: Process[] = [];
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  if (req.headers.authorization !== serverConfig.token) {
    res.status(401).send("Unauthorized");
    return;
  }
  next();
});

app.post("/up", async (req: Request<{}, {}, UpRequest>, res: Response) => {
  const { project, config } = req.body;
  const { domain, port } = config;
  const { remote } = project;

  if (!domain || !port) {
    res.status(400).json({ error: "Missing domain or port" });
    return;
  }

  if (!remote) {
    res.status(400).json({ error: "Missing remote" });
    return;
  }

  const projectName = project.remote.split("/").pop()!.split(".").shift()!;

  const projectDir = `${serverConfig.dir}/${projectName}`;

  if (!fs.existsSync(projectDir)) {
    try {
      mkdir(projectDir);
      await execa(`git clone ${remote} ${projectDir}`);

      process.chdir(projectDir);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: e });
      return;
    }
  } else {
    await execa(`cd ${projectDir}`);
    await execa("git pull");
  }

  console.log(`In directory ${cwd()}`);

  if (config.install) {
    console.log(
      `Installing dependencies for ${projectName} with ${config.install}`
    );
    await execa(config.install);
  }

  if (config.build) {
    console.log(`Building ${projectName} with ${config.build}`);
    await execa(config.build);
  }

  if (config.start) {
    console.log(`Starting ${projectName} with ${config.start}`);
    const child = exec(config.start);

    child.on("spawn", () => {
      runningProcesses.push({
        pid: child.pid!,
        name: projectName,
        command: child.spawnargs.join(" "),
      });
    });

    child.on("exit", () =>
      runningProcesses.splice(
        runningProcesses.findIndex((p) => p.pid === child.pid),
        1
      )
    );

    child.on("error", (e) => {
      console.log(e);
    });
  }

  res.status(200).json({ success: true });
});

app.get("/ps", (_, res) => res.json(runningProcesses));

app.get("/", (_, res) => res.send("hi"));

export default {
  run: (cfg: ServerConfig) => {
    serverConfig = cfg;
    app.listen(cfg.port, () => {
      console.log(`toad running on port ${cfg.port}`);
    });
  },
};
