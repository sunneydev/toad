import { getCurrentProject, getGitRemoteURL, toadYAML } from "./utils";
import { stringify } from "yaml";
import config from "./config";
import inquirer from "inquirer";
import fs from "node:fs";

const setup = async () => {
  const { endpoint, token, https } = await inquirer.prompt([
    {
      type: "input",
      name: "endpoint",
      message: "Your endpoint (toad.sunney.dev): ",
    },
    {
      type: "input",
      name: "token",
      message: "Your token: ",
    },
    {
      type: "list",
      name: "https",
      message: "Use https (y/n): ",
      choices: ["y", "n"],
    },
  ]);

  config.save({ endpoint, token, https: https === "y" });
};

const init = async () => {
  const remoteURL = getGitRemoteURL();

  if (!remoteURL) {
    console.error("No git remote found");
    console.error("Run 'git remote add origin <url>' first");
    return;
  }

  const { domain, port, install, build, start } = await inquirer.prompt([
    {
      type: "input",
      name: "domain",
      message: "Domain: ",
    },
    {
      type: "input",
      name: "port",
      message: "Port: ",
    },
    {
      type: "input",
      name: "install",
      message: "Install command (npm install): ",
      default: "npm install",
    },
    {
      type: "input",
      name: "build",
      message: "Build command (npm run build): ",
      default: "npm run build",
    },
    {
      type: "input",
      name: "start",
      message: "Start command (npm run start): ",
      default: "npm run start",
    },
  ]);

  const projectConfig = { domain, port, install, build, start };

  fs.writeFileSync("toad.yml", stringify(projectConfig));

  config.update((prev) => ({
    ...prev,
    projects: [
      ...(prev.projects || []),
      {
        dir: process.cwd(),
        remote: remoteURL,
        config: projectConfig,
      },
    ],
  }));

  await up();
};

const up = async () => {
  const cfg = config.load();
  const project = getCurrentProject();

  if (!project) {
    console.error("Run 'toad init' first");
    return;
  }

  const projectConfig = toadYAML();

  const res = await fetch(
    `${cfg.https ? "https" : "http"}://${cfg.endpoint}/up`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: cfg.token,
      },
      body: JSON.stringify({ config: projectConfig, project }),
    }
  );

  const data = await res.json();

  console.log(data);
};

export default { init, up, setup };
