import Conf from "conf";
import { secureRandomToken } from "./utils.js";
import { z } from "zod";

const conf = new Conf({
  projectName: "toad-server",
  projectSuffix: "",
  defaults: {
    github: {
      clientId: "",
      clientSecret: "",
    },
    token: secureRandomToken(),
  },
});

const github = conf.get("github");

const githubSchema = z.object({
  clientId: z.string().nonempty(),
  clientSecret: z.string().nonempty(),
});

try {
  githubSchema.parse(github);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(
      `Invalid GitHub configuration, update values in ${conf.path}`
    );
  } else {
    console.error(error);
  }
  process.exit(1);
}
export const config = {
  github,
};
