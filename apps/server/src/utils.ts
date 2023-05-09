import { ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import { promises as fs, existsSync as dirExists } from "node:fs";
import path from "node:path";

export function secureRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function verifySignature(
  payloadBody: Buffer,
  secretToken: string,
  signatureHeader: string | undefined
): void {
  if (!signatureHeader) {
    throw new Error("x-hub-signature-256 header is missing!");
  }

  const hashObject = crypto
    .createHmac("sha256", secretToken)
    .update(payloadBody)
    .digest("hex");
  const expectedSignature = `sha256=${hashObject}`;

  if (signatureHeader !== expectedSignature) {
    throw new Error("Request signatures didn't match!");
  }
}

export async function saveProcessesMap(
  processesMap: Map<string, ChildProcess>
) {
  const serializedMap = JSON.stringify(Array.from(processesMap.entries()));
  await fs.writeFile("processesMap.json", serializedMap, "utf8");
}

export async function getProjectDirectories(
  root: string,
  depth = 0
): Promise<string[]> {
  if (!dirExists(root)) {
    return [];
  }

  depth += 1;
  const files = await fs.readdir(root, { withFileTypes: true });
  const subdirs: string[] = [];

  for (const file of files) {
    if (file.isDirectory()) {
      subdirs.push(path.join(root, file.name));
      if (depth < 2) {
        subdirs.push(
          ...(await getProjectDirectories(path.join(root, file.name), depth))
        );
      }
    }
  }

  return subdirs.filter((dir) => dirExists(path.join(dir, ".git")));
}
