import crypto from "node:crypto";

export function secureRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}
