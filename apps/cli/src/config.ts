import dotenv from "dotenv";

dotenv.config();

if (!process.env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is not set");
}

export const cfg = {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
};
