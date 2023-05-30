import { api } from "../api.js";
import { ToadConfig } from "../toad-config.js";

export async function stop(projectName?: string) {
  console.log("Stopping project", projectName);

  const config = new ToadConfig();

  if (!projectName) {
    if (!config.exists) {
      throw new Error("Project not initialized, please run `toad init` first");
    }

    if (!config.name) {
      throw new Error("Project name not set, please run `toad init` first");
    }

    projectName = config.name;
  }

  console.log("Stopping project", projectName);

  const response = await api().post(`/stop/${projectName}`);

  console.log(response.data);
}
