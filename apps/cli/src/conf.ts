import Conf from "conf";

export const conf = new Conf({
  projectName: "toad-cli",
  projectSuffix: "",
  defaults: { token: "", domain: "" },
});
