import { pathToFileURL } from "node:url";
import type { ReactNode } from "react";

export interface ExtensionModule {
	default: ReactNode | (() => ReactNode);
	[key: string]: unknown;
}

export interface LoadedExtension {
	id: string;
	path: string;
	command: string;
	module: ExtensionModule;
	component: ReactNode;
}

export async function loadExtension(
	extensionPath: string,
	command: string,
): Promise<LoadedExtension> {
	const entryPath = `${extensionPath}/${command}.js`;
	console.error("[LOADER] Loading extension from:", entryPath);
	console.error("[LOADER] Extension path:", extensionPath);
	console.error("[LOADER] Command:", command);

	try {
		const moduleUrl = pathToFileURL(entryPath).href;
		console.error("[LOADER] Importing module from URL:", moduleUrl);

		const module = (await import(
			pathToFileURL(entryPath).href
		)) as ExtensionModule;
		console.error("[LOADER] Module imported successfully");
		console.error("[LOADER] Module exports:", Object.keys(module));
		console.error("[LOADER] Module default type:", typeof module.default);

		const component =
			typeof module.default === "function" ? module.default() : module.default;
		console.error("[LOADER] Component resolved, type:", typeof component);

		const extensionId = `${extensionPath.split("/").pop()}-${command}`;
		console.error("[LOADER] Generated extension ID:", extensionId);

		return {
			id: extensionId,
			path: extensionPath,
			command,
			module,
			component,
		};
	} catch (error) {
		console.error("[LOADER] Failed to load extension:", error);
		throw new Error(
			`Failed to load extension at ${entryPath}: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export function validateExtension(module: unknown): module is ExtensionModule {
	if (typeof module !== "object" || module === null) {
		return false;
	}

	const m = module as Record<string, unknown>;
	return "default" in m;
}
