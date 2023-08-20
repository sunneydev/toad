#!/usr/bin/env node
import { program } from "commander";
import {
  setup,
  init,
  up,
  projects,
  stop,
  start,
  status,
} from "./commands/index.js";

program.version("0.0.1").description("Toad CLI");

program
  .command("setup")
  .description("Setup toad CLI")
  .option("-t, --token <token>", "Your toad token")
  .option("-d, --domain <domain>", "Your toad domain")
  .action(setup);

program
  .command("init [name]")
  .option("-ad, --appDomain <app_domain>", "Your app domain (for Caddy)")
  .description("Initialize a new project")
  .action(init);

program.command("up").description("Upload your project").action(up);

program.command("projects").description("Show all projects").action(projects);

program
  .command("status [project]")
  .description("Show project status")
  .action(status);

program.command("stop [project]").description("Stop a project").action(stop);

program.command("start [project]").description("Start a project").action(start);

program.parseAsync(process.argv);
