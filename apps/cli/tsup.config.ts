import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  sourcemap: !options.watch,
  minify: !options.watch,
  clean: !options.watch,
  format: options.watch ? ["esm"] : ["cjs", "esm"],
  dts: true,
  outDir: "lib",
  onSuccess: options.watch ? "node lib/index.mjs" : undefined,
}));
