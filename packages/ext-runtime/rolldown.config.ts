import { defineConfig } from "rolldown";

export default defineConfig([
	{
		input: "src/index.ts",
		output: {
			format: "esm",
			file: "dist/index.mjs",
			sourcemap: true,
		},
		platform: "node",
	},
	{
		input: "src/index.ts",
		output: {
			format: "cjs",
			file: "dist/index.cjs",
			sourcemap: true,
		},
		platform: "node",
		external: [],
	},
	{
		input: "src/cli.ts",
		output: {
			format: "cjs",
			file: "dist/cli.cjs",
			banner: "#!/usr/bin/env node",
		},
		platform: "node",
		external: [],
	},
]);
