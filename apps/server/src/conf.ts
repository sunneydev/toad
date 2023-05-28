import Conf from "conf";
import { generateToken } from "./utils.js";

export const conf = new Conf({
  projectName: "toad-server",
  projectSuffix: "",
  defaults: {
    token: generateToken(),
  },
});
