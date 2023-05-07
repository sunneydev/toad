// import express from "express";
// import { Octokit } from "@octokit/core";
// import { AuthProps } from "shared/types";
import { config } from "./config";

console.log(config);

// const app = express();
// const octokit = new Octokit();

// app.use(express.json());

// app.post("/auth", (req, res) => {
//   const auth: Partial<AuthProps> = req.body;

//   if (!auth.token || !auth.domain || !auth.secret) {
//     res.status(400).send("Missing auth props");
//     return;
//   }

//   if (!auth) {
//     res.status(400).send("Missing auth");
//     return;
//   }
// });

// app.post("/watch", (req, res) => {
//   const { repository } = req.body;

//   if (!repository) {
//     res.status(400).send("Missing repository");
//     return;
//   }

//   req.octokit.request("POST /repos/{owner}/{repo}/hooks", {
//     owner: repository.owner.login,
//     repo: repository.name,
//     active: true,
//     events: ["push"],
//     config: {
//       url: ``,
//       content_type: "json",
//       insecure_ssl: "0",
//     },
//   });

//   res.send("Hello World!");
// });
