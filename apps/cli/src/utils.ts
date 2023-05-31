import { promises as fs } from "node:fs";
import path from "node:path";

export async function clearDirectory(directory: string) {
  const files = await fs.readdir(directory);
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = await fs.lstat(filePath);

    if (stat.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true }); // Deletes directory and its contents
    } else {
      await fs.unlink(filePath); // Deletes file
    }
  }
}
