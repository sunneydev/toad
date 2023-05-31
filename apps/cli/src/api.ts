import { SetupRequest } from "./types.js";
import { conf } from "./conf.js";
import { requests } from "@sunney/requests";
import { program } from "commander";

function handleApiErrorMessage(
  message?: string,
  error?: string,
  statusCode?: number
) {
  const msg =
    message && error
      ? `${message}: ${error}`
      : message && !error
      ? message
      : error && !message
      ? error
      : `Unknown error occured. Status code: ${statusCode}`;

  program.error(msg);
}

export const api = (authProps?: SetupRequest) => {
  const { domain, token } = authProps ?? conf.store;

  if (!domain) {
    throw new Error("Domain not set. Please run `toad setup` first.");
  } else if (!token) {
    throw new Error("Token not set. Please run `toad setup` first.");
  }

  const prefix = domain.includes("0.0.0.0") ? "http" : "https";

  return requests.client({
    baseUrl: `${prefix}://${domain}/api`,
    headers: { Authorization: `Bearer ${token}` },
    interceptors: {
      onResponse(url, init, response) {
        const data = response.data as any;

        if ("ok" in data) {
          if (data.ok) {
            handleApiErrorMessage(data.message, data.error, response.status);
          } else {
            console.log(data.message);
          }
        }
      },
    },
  });
};
