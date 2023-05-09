import { program } from "commander";
import authCommand from "./commands/auth.command.js";
import watchCommand from "./commands/watch.command.js";

program.name("toad");

program.addCommand(authCommand);
program.addCommand(watchCommand);

program.parse(process.argv);
