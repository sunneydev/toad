import { Command } from "commander";
import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import chalk from "chalk";
import open from "open";
import { Requests } from "@sunney/requests";
import { setConfig } from "../config.js";

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
    } else if (!options.domain.startsWith("http")) {
      command.error("Invalid domain, must start with http(s)://");
    }

    const api = new Requests({ baseUrl: options.domain });

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

        await new Promise<void>((resolve) => {
          process.stdin.once("data", () => {
            process.stdin.pause();
            resolve();
          });
        });

        open(verification.verification_uri);
      },
    });

    const tokenAuthentication = await auth({ type: "oauth" });

    const response = await api.post<{ token: string; error?: string }>(
      "/auth",
      {
        body: {
          scopes: tokenAuthentication.scopes,
          token: tokenAuthentication.token,
        },
      }
    );

    if (response.status !== 200) {
      console.log(chalk.red("❌ Authentication failed"));
      console.log(
        "Error:",
        chalk.red(response.data.error ?? "Unknown error occured")
      );
      process.exit(1);
    }

    setConfig("domain", options.domain);
    setConfig("secret", response.data.token);

    console.log(chalk.green("✅ Authentication successful"));
  });

export default command;
