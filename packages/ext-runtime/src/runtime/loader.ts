import { pathToFileURL } from "node:url";
import type { FunctionComponent, ReactElement } from "react";
import React from "react";

export interface ExtensionModule {
	default: React.ReactNode | (() => React.ReactNode) | React.ComponentType;
	[key: string]: unknown;
}

export interface LoadedExtension {
	id: string;
	path: string;
	command: string;
	module: ExtensionModule;
	component: ReactElement;
}

export async function loadExtension(
	extensionPath: string,
	command: string,
): Promise<LoadedExtension> {
	const entryPath = `${extensionPath}/${command}.js`;

	try {
		const module = (await import(
			pathToFileURL(entryPath).href
		)) as ExtensionModule;

		let component: ReactElement;
		let defaultExport: unknown = module.default;

		// Handle CommonJS modules with nested default
		if (
			defaultExport &&
			typeof defaultExport === "object" &&
			"default" in defaultExport &&
			!React.isValidElement(defaultExport)
		) {
			defaultExport = (defaultExport as Record<string, unknown>).default;
		}

		if (React.isValidElement(defaultExport)) {
			component = defaultExport as ReactElement;
		} else if (typeof defaultExport === "function") {
			component = React.createElement(defaultExport as FunctionComponent);
		} else {
			const Wrapper = () => defaultExport as React.ReactNode;
			component = React.createElement(Wrapper);
		}

		const extensionId = `${extensionPath.split("/").pop()}-${command}`;

		return {
			id: extensionId,
			path: extensionPath,
			command,
			module,
			component,
		};
	} catch (error) {
		throw new Error(
			`Failed to load extension at ${entryPath}: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
