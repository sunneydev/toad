import { ApiResponse, SetupRequest } from "./types.js";
import { conf } from "./conf.js";
import { requests } from "@sunney/requests";

export const api = (authProps?: SetupRequest) => {
  const { domain, token } = authProps ?? conf.store;

  if (!domain) {
    throw new Error("Domain not set. Please run `toad setup` first.");
  } else if (!token) {
    throw new Error("Token not set. Please run `toad setup` first.");
  }

  const prefix = domain.includes("0.0.0.0") ? "http" : "https";

  const client = requests.client({
    baseUrl: `${prefix}://${domain}/api`,
    headers: { Authorization: `Bearer ${token}` },
  });

  client.intercept<ApiResponse>({
    onResponse(url, init, response) {
      const data = response.data;

      if (typeof data === "string") {
        if (!response.ok && !data) {
          console.log(
            `Request to ${url} failed with status ${response.status}`
          );
        } else {
          console.log(data);
        }

        return;
      }

      if (data.ok) {
        console.log(data.message);
      } else {
        const errorMessage =
          data.message && data.error
            ? `${data.message}: ${data.error}`
            : data.message && !data.error
            ? data.message
            : data.error ?? "Unknown error";

        console.error(errorMessage);
      }
    },
  });
};
