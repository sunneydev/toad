import express from "express";
import { config } from "./config.js";
import { Octokit } from "@octokit/core";

const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  const { body } = req.body;
  console.log(body);
  res.send("ok");
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

  if (
    !config.allowedUsernames.includes(data.login) &&
    !config.allowedUsernames.includes("*") // allow all users if "*" is in the list
  ) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const userToken = config.addUser(token);

  res.json({ success: true, token: userToken });
});

app.post("/watch", async (req, res) => {
  const secret = req.headers["x-secret"];

  if (typeof secret !== "string") {
    res.status(400).json({ error: "Missing secret" });
    return;
  }

  const token = config.getToken(secret);

  if (!token) {
    res.status(403).json({ error: "Invalid secret" });
    return;
  }

  const { repository: repositoryPath } = req.body;

  if (typeof repositoryPath !== "string") {
    res.status(400).json({ error: "Missing repository" });
    return;
  }

  const [owner, repo] = repositoryPath.split("/");

  if (!owner || !repo) {
    res
      .status(400)
      .json({ error: "Invalid repository, use format of `owner/repo`" });
    return;
  }

  const octokit = new Octokit({ auth: token });

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
