import { Command } from "commander";

const command = new Command("auth")
  .description("Authenticate with the server")
  .option("-t, --token <token>", "The GitHub token for the server to use")
  .option(
    "-s, --secret <secret>",
    "Secret between you and the server to assure the request is from you"
  )
  .option(
    "-d  --domain <domain>",
    "The domain of the API endpoint to connect to"
  )
  .action((options) => {});

export default command;
