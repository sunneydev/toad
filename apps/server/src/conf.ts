import Conf from "conf";
import { generateToken } from "./utils.js";

export const conf = new Conf({
  projectName: "toad-server",
  projectSuffix: "",
  defaults: {
    token: generateToken(),
    redis_host: "",
    redis_port: 6379,
    redis_password: "",
  },
});
