#!/usr/bin/env node
import { conf } from "./conf.js";
import { start } from "./server.js";

const command = process.argv[process.argv.length - 1];

if (command === "setup") {
  const token = conf.store.token;
  console.log(`Your token is: ${token}`);
  process.exit(0);
} else {
  start();
}
