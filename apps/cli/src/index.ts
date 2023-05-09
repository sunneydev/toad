import { program, Argument } from "commander";
import requests from "@sunney/requests";
import { AuthProps } from "shared/types.js";
import authCommand from "./commands/auth.command.js";
import watchCommand from "./commands/watch.command.js";

const apiClient = ({ token, domain, secret }: AuthProps) =>
  requests.default.client({
    baseUrl: `https://${domain}`,
    headers: {
      "X-Secret": secret,
    },
  });

program.addCommand(authCommand);
program.addCommand(watchCommand);

program.parse(process.argv);
