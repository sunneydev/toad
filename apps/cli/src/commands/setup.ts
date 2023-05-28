import type { SetupRequest } from "shared/types.js";
import { api } from "../api.js";
import { conf } from "../conf.js";
import prompts from "prompts";

const tokenPrompt = () =>
  prompts({
    type: "password",
    name: "token",
    message: "Your toad token",
    validate: (value: string) =>
      value.length > 0 ? true : "Please provide a valid value",
  }).then((r) => r.token);

const domainPrompt = () =>
  prompts({
    type: "text",
    name: "domain",
    message: "Your toad domain",
    validate: (value: string) =>
      value.length > 0 ? true : "Please provide a valid value",
  }).then((r) => r.domain);

export async function setup({ token, domain }: SetupRequest) {
  token ||= await tokenPrompt();
  domain ||= await domainPrompt();

  const response = await api({ token, domain }).get("/auth");

  if (!response.ok) {
    throw new Error("Invalid token or domain");
  }

  conf.set("token", token);
  conf.set("domain", domain);

  console.log("Setup complete, succesfully authenticated! 🎉");
}
