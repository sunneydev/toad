import { Argument, Command } from "commander";

const command = new Command("watch")
  .description("Watch a repository for changes")
  .addArgument(new Argument("<repository>", "The repository to watch"))
  .action(async (repository: string) => {});

export default command;
