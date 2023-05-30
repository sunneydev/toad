import { ToadProject } from "shared/types.js";
import { api } from "../api.js";

export async function projects() {
  const projects = await api().get<ToadProject[]>("/projects");

  const output = projects.data.map(
    (p) => `${p.name} - status: ${p.process?.status}\n`
  );

  console.log(output.join(""));
}
