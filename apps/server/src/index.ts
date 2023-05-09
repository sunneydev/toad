import express from "express";
import { config } from "./config.js";
import { Octokit } from "@octokit/core";
import { RepositoryPushEvent } from "./types.js";
import { promises as fs, existsSync as dirExists } from "node:fs";
import { simpleGit as git } from "simple-git";
import { verifySignature } from "./utils.js";
import path from "node:path";
import ProcessManager from "./processManager.js";

const app = express();
const pm = new ProcessManager();

app.use(express.json());

app.get("/processes", async (req, res) => {
  const processes = await pm
    .listProcesses()
    .then((lp) => lp.map((p) => `${p.name} - ${p.pid}`));

  res.send(processes.join("\n"));
});

app.post("/webhook", async (req, res) => {
  const buffer = Buffer.from(JSON.stringify(req.body));
  const signatureHeader = req.headers["x-hub-signature-256"];

  if (typeof signatureHeader !== "string") {
    res.status(400).json({ error: "Missing or malformed signature" });
    return;
  }

  const pushEvent: RepositoryPushEvent = req.body;

  if (!pushEvent.repository) {
    res.status(400).json({ error: "Missing repository" });
    return;
  }

  const username = pushEvent.repository.owner.name;
  const repo = pushEvent.repository.name;

  if (!username || !repo) {
    res.status(400).json({ error: "Missing user or repo" });
    return;
  }

  const auth = config.getAuthByUsername(username);

  if (!auth) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    verifySignature(buffer, auth.secret, signatureHeader);
  } catch (e) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const repositoryPath = path.join(
    config.projectsPath,
    pushEvent.repository.full_name
  );

  if (!dirExists(repositoryPath)) {
    const cloneUrl = `https://${username}:${auth.githubToken}@github.com/${username}/${repo}`;

    try {
      await git().clone(cloneUrl, repositoryPath);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to clone repository" });
      return;
    }

    res.json({ success: true });
    return;
  }

  const gitInstance = git(repositoryPath);

  try {
    await gitInstance.pull();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to pull repository" });
    return;
  }
  await pm.addProcess(`${username}/${repo}`, "npm", {
    cwd: repositoryPath,
    args: ["run", "start"],
  });

  res.json({ success: true });
});

app.post("/auth", async (req, res) => {
  const { token, scopes } = req.body;

  if (!token) {
    res.status(400).json({ message: "Missing token" });
    return;
  }

  if (!scopes || !Array.isArray(scopes) || !scopes.includes("repo")) {
    res.status(400).json({ message: "Missing scopes" });
    return;
  }

  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.request("GET /user");

  const username = data.login;

  if (
    !config.allowedUsernames.includes(username) &&
    !config.allowedUsernames.includes("*") // allow all users if "*" is in the list
  ) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const userToken = config.addUser(username, token);

  res.json({ success: true, token: userToken, username });
});

app.post("/watch", async (req, res) => {
  const secret = req.headers["x-secret"];

  if (typeof secret !== "string") {
    res.status(400).json({ error: "Missing secret" });
    return;
  }

  const auth = config.getAuth(secret);

  if (!auth) {
    res.status(403).json({ error: "Invalid secret" });
    return;
  }

  const { repository: repositoryPath } = req.body;

  const [owner, repo] = repositoryPath.split("/");

  if (owner !== auth.username) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const octokit = new Octokit({ auth: auth.token });

  const repository = await octokit.request("GET /repos/{owner}/{repo}", {
    owner,
    repo,
  });

  if (!repository) {
    res.status(400).json({ error: "Repository not found" });
    return;
  }

  try {
    await octokit.request("POST /repos/{owner}/{repo}/hooks", {
      owner,
      repo,
      events: ["push"],
      config: {
        url: `https://${req.hostname}/webhook`,
        content_type: "json",
        secret,
      },
    });

    res.json({
      success: true,
      message: `Watching ${repositoryPath}`,
    });
  } catch (e: any) {
    res.status(400).json({
      error:
        "Error occured while creating the webhook, most likely the webhook already exists.",
    });
  }
});

app.listen(config.port, () => {
  console.log(`🌎 Toad server running on port ${config.port}`);
});
