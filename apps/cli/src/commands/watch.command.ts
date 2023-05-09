import { Argument, Command } from "commander";
import { config } from "../config.js";
import chalk from "chalk";
import { Requests } from "@sunney/requests";

const command = new Command("watch")
  .description("Watch a repository for changes")
  .addArgument(new Argument("<repository>", "The repository to watch"))
  .action(async (repository: string) => {
    const { secret, domain } = config;

    if (!secret || !domain) {
      command.error("Not authenticated, run `toad auth` first");
      process.exit(1);
    }

    const api = new Requests({
      baseUrl: domain,
      headers: { "X-Secret": secret },
    });

    const response = await api.post<{ error?: string; message?: string }>(
      "/watch",
      { body: { repository } }
    );

    if (response.status !== 200) {
      console.log(chalk.red("❌ Failed to watch repository"));
      console.log(chalk.red(response.data.error || "Unknown error"));
      process.exit(1);
    }

    console.log(chalk.green("✅ Watching repository"), chalk.bold(repository));
  });

export default command;
