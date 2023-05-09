import { Command } from "commander";
import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import chalk from "chalk";
import open from "open";
import { Requests } from "@sunney/requests";

const clientId = "63c249ff782add442998";

const command = new Command("auth")
  .description("Authenticate with the server")
  .option(
    "-d, --domain <domain>",
    "The domain of the API endpoint to connect to"
  )
  .action(async (options) => {
    if (!options.domain) {
      command.error("Missing domain");
    }

    const api = new Requests({
      baseUrl: `https://${options.domain}`,
    });

    const auth = createOAuthDeviceAuth({
      clientId,
      scopes: ["repo"],
      onVerification: async (verification) => {
        console.log(
          chalk.yellow("!"),
          "First copy your one-time code:",
          chalk.bold(verification.user_code)
        );

        process.stdout.write(
          chalk.bold("Press Enter") + " to open github.com in your browser..."
        );

        await new Promise((resolve) => {
          process.stdin.once("data", resolve);
        });

        open(verification.verification_uri);
      },
    });

    const tokenAuthentication = await auth({ type: "oauth" });
  });

export default command;
