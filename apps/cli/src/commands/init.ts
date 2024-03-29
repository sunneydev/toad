import path from "path";
import { ToadConfig } from "../toad-config.js";
import prompts from "prompts";
import { api } from "../api.js";
import { ApiResponse, ToadProject } from "../types.js";

export async function init(name?: string, options?: { appDomain?: string }) {
  const projectDirectoryPath = process.cwd();

  const { directoryAcceptable } = await prompts({
    type: "confirm",
    name: "directoryAcceptable",
    message: `Would you like to create a new project in ${projectDirectoryPath}?`,
    initial: "y",
  });

  if (!directoryAcceptable) {
    throw new Error("Exiting...");
  }

  const directoryName = path.basename(projectDirectoryPath);

  const { projectName } = await prompts({
    type: "text",
    name: "projectName",
    message: "What do you want to name your project?",
    initial: name || directoryName,
    validate: (value) =>
      /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(value)
        ? true
        : "Please enter a project name",
  });

  if (typeof projectName !== "string") {
    throw new Error("Invalid project name");
  }

  const projects = await api()
    .get<ApiResponse<{ projects: ToadProject[] }>>("/projects")
    .then((r) => r.data.projects);

  if (projects) {
    const projectExists = projects.find(
      (project) => project.name === projectName
    );

    if (projectExists) {
      throw new Error("A project with that name already exists");
    }
  }

  const config = new ToadConfig().setName(projectName);

  if (config.exists && projectName == config.name) {
    throw new Error(`Project ${projectName} is already initialized`);
  }

  await config.save({
    name: projectName,
    appDomain: options?.appDomain,
  });
}
