import Conf from "conf";
import { secureRandomToken } from "./utils.js";
import path from "node:path";
import os from "node:os";

export const conf = new Conf({
  projectName: "toad-server",
  projectSuffix: "",
  defaults: {
    allowedUsernames: ["*"] as string[],
    port: 8011,
    projectsPath: path.join("~", "/toad-projects").replace("~", os.homedir()),
  },
});

console.log(conf.path);

const github = conf.get("github");
const allowedUsernames = conf.get("allowedUsernames");
const port = conf.get("port");
const projectsPath = conf.get("projectsPath");

export const config = {
  projectsPath,
  github,
  port,
  allowedUsernames,
  addUser: (username: string, token: string): string => {
    const secureToken = secureRandomToken();

    conf.set(`authentications.${secureToken}`, {
      username,
      token,
    });

    return secureToken;
  },
  getAuth: (
    secureToken: string
  ):
    | {
        username: string;
        token: string;
      }
    | undefined => {
    return conf.get(`authentications.${secureToken}`);
  },
  getAuthByUsername: (
    username: string
  ):
    | {
        githubToken: string;
        secret: string;
      }
    | undefined => {
    const authentications = conf.get("authentications") as {
      [secureToken: string]: { username: string; token: string };
    };

    for (const [secureToken, auth] of Object.entries(authentications)) {
      if (auth.username === username) {
        return {
          secret: secureToken,
          githubToken: auth.token,
        };
      }
    }
  },
  removeAuth: (secureToken: string): void => {},
};
