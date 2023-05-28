import path from "path";
import { ToadConfig } from "../toad-config.js";
import prompts from "prompts";
import { api } from "../api.js";
import { ToadProject } from "shared/types.js";

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
      /^[a-zA-Z0-9]+$/.test(value) ? true : "Please enter a project name",
  });

  if (typeof projectName !== "string") {
    throw new Error("Invalid project name");
  }

  const projects = await api()
    .get<ToadProject[]>("/projects")
    .then((r) => r.data);

  if (projects) {
    const projectExists = projects.find(
      (project) => project.name === projectName
    );

    if (projectExists) {
      throw new Error("A project with that name already exists");
    }
  }

  console.log({
    name: projectName,
    projectDirectoryPath,
  });

  const config = new ToadConfig(projectDirectoryPath, name);

  if (config.exists && projectName == config.name) {
    throw new Error(`Project ${projectName} is already initialized`);
  }

  await config.save({
    name: projectName,
    appDomain: options?.appDomain,
  });
}
