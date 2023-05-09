import { defineConfig, type Options } from "tsup";

export default defineConfig((flags) => {
  const buildOptions: Options = {
    minify: true,
    clean: true,
    format: ["cjs", "esm"],
    dts: true,
  };

  const devOptions: Options = {
    sourcemap: true,
    format: ["esm"],
    onSuccess: "node ./lib/index.js",
  };

  const options = flags.watch ? devOptions : buildOptions;

  console.log(options.format);

  return {
    entry: ["src/index.ts"],
    outDir: "lib",
    ...options,
  };
});
