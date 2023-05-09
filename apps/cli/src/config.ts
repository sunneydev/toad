import Conf from "conf";

const conf = new Conf({
  projectName: "toad-cli",
  projectSuffix: "",
  defaults: {},
});

export const config = {
  domain: conf.get("domain") as string | undefined,
  secret: conf.get("secret") as string | undefined,
};

export const setConfig = (key: string, value: string) => {
  conf.set(key, value);
};
