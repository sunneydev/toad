#!/usr/bin/env node
import meow from "meow";
import app from "./app.mjs";
import { homedir } from "os";
import { loadConfig, saveConfig } from "./utils.js";

const cli = meow(
  `
    Usage
        $ toad-server --port 3000 --token 1234 --dir /home/user/projects

    Options
        --port, -p Port to run the server on
        --token, -t Token to authenticate requests with
        --dir, -d Directory to watch for projects
    
    Examples
        $ toad-server --port 3000 --token 1234 --dir /home/user/projects
`,
  {
    importMeta: import.meta,
    flags: {
      port: {
        type: "string",
        alias: "p",
        default: "3535",
      },
      token: {
        type: "string",
        alias: "t",
      },
      dir: {
        type: "string",
        alias: "d",
        default: homedir() + "/projects",
      },
    },
    autoHelp: true,
  }
);

let cfg = loadConfig();

if (!cfg) {
  if (!cli.flags.token) {
    console.log("No token provided");
    process.exit(1);
  }

  cfg = {
    port: cli.flags.port,
    token: cli.flags.token,
    dir: cli.flags.dir,
  };

  saveConfig(cfg);
}

app.run(cfg);
