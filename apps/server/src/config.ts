import Conf from "conf";
import { secureRandomToken } from "./utils.js";

const conf = new Conf({
  projectName: "toad-server",
  projectSuffix: "",
  defaults: {
    allowedUsernames: ["*"] as string[],
    port: 8011,
  },
});

console.log(conf.path);

const github = conf.get("github");
const allowedUsernames = conf.get("allowedUsernames");
const port = conf.get("port");

export const config = {
  github,
  port,
  allowedUsernames,
  addUser: (token: string): string => {
    const secureToken = secureRandomToken();

    conf.set(secureToken, token);

    return secureToken;
  },
  getToken: (secureToken: string): string | undefined => {
    return conf.get(secureToken);
  },
};
