import { Octokit } from "@octokit/core";

declare global {
  namespace Express {
    interface Request {
      octokit: Octokit;
    }
  }
}
