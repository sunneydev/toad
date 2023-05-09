import express from "express";
import { config } from "./config.js";
import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";

const app = express();

async function main() {
  const { clientId } = config.github;

  const auth = createOAuthDeviceAuth({
    clientId,
    scopes: ["repo"],
    onVerification: async (verification) => {
      console.log(
        `Open ${verification.verification_uri} in your browser and enter code ${verification.user_code}`
      );
    },
  });

  const tokenAuthentication = await auth({ type: "oauth" });

  console.log(tokenAuthentication);
}

main()
  .then(() => console.log("Done ✅"))
  .catch(console.error);

app.use(express.json());

app.post("/auth", async (req, res) => {
  return res.json({ success: true });
});

app.post("/watch", (req, res) => {
  const { repository } = req.body;

  if (!repository) {
    res.status(400).send("Missing repository");
    return;
  }

  // req.octokit.request("POST /repos/{owner}/{repo}/hooks", {
  //   owner: repository.owner.login,
  //   repo: repository.name,
  //   active: true,
  //   events: ["push"],
  //   config: {
  //     url: ``,
  //     content_type: "json",
  //     insecure_ssl: "0",
  //   },
  // });

  res.send("Hello World!");
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
