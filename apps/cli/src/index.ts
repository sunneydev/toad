import { program, Argument } from "commander";
import { FileSystemCache } from "file-system-cache";
import requests from "@sunney/requests";
import { AuthProps } from "shared/types";
import { validateAuthProps } from "./utils";

const cache = new FileSystemCache({
  basePath: "~/.toad/config",
  ns: "toad-cli",
});

const apiClient = ({ token, domain, secret }: AuthProps) =>
  requests.client({
    baseUrl: `https://${domain}`,
    headers: {
      "X-Github-Token": token,
      "X-Secret": secret,
    },
  });

program
  .command("auth")
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
  .action(async (authProps: Partial<AuthProps>) => {
    if (!validateAuthProps(authProps)) {
      program.error("Invalid auth props");
    }

    const api = apiClient(authProps);

    const response = await api.post("/auth", {
      body: { domain: authProps.domain },
    });

    if (response.status !== 200) {
      program.error("Invalid token");
    }

    await cache.set("auth", authProps);
  });

program
  .command("watch")
  .description("Watch a repository for changes")
  .addArgument(new Argument("<repository>", "The repository to watch"))
  .action(async (repository: string) => {
    if (!repository) {
      program.error("No repository provided");
    }

    const auth = cache.getSync("auth") as Partial<AuthProps>;

    if (!validateAuthProps(auth)) {
      program.error("Invalid auth config");
    }

    const api = apiClient(auth);

    const response = await api.post<{
      message: string;
      error?: string;
    }>("/watch", {
      body: { repository },
    });

    if (response.status !== 200) {
      program.error(response.data.error || "Unknown error");
    }

    console.log(response.data.message);
  });

program.parse(process.argv);
