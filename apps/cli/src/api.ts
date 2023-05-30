import { SetupRequest } from "./types.js";
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

  return requests.client({
    baseUrl: `${prefix}://${domain}/api`,
    headers: { Authorization: `Bearer ${token}` },
  });
};
