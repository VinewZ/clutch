import { defineConfig } from "rolldown";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default defineConfig([
	{
		input: "src/cli.ts",
		output: {
			format: "cjs",
			file: "dist/cli.cjs",
			banner: "#!/usr/bin/env node",
		},
		platform: "node",
		external: [],
		resolve: {
			alias: {
				react: require.resolve("react"),
			},
		},
	},
]);
