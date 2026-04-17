import { defineConfig } from "rolldown";

export default defineConfig([
	// ESM build
	{
		input: "src/index.ts",
		output: {
			format: "esm",
			file: "dist/index.mjs",
			sourcemap: true,
		},
		platform: "node",
	},
	// CJS build
	{
		input: "src/index.ts",
		output: {
			format: "cjs",
			file: "dist/index.cjs",
			sourcemap: true,
		},
		platform: "node",
	},
]);
