#!/usr/bin/env node
import commands from "./commands";

const main = async () => {
  const cmd = process.argv[process.argv.length - 1] as
    | keyof typeof commands
    | "help";

  const availableCommands = Object.keys(commands);

  if (!cmd || cmd === "help") {
    console.log(`Available commands: ${availableCommands.join(", ")}`);
    return;
  }

  if (!availableCommands.includes(cmd)) {
    console.error(`"${cmd}" is not a valid command`);
    return;
  }

  await commands[cmd]();
};

main().catch(console.error);
