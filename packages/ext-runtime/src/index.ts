import Module from "node:module";
import React from "react";
import { clutch } from "@clutch/api";
import { jsx, jsxs, Fragment } from "./jsx-runtime";

const jsxRuntime = { jsx, jsxs, Fragment };

console.error("[DEBUG] jsxRuntime defined:", jsxRuntime);
console.error("[DEBUG] jsxRuntime.jsx type:", typeof jsx);

export const REWRITE_MAP = new Map<string, unknown>([
	["@raycast/api", clutch.api],
	["react", React],
	["react/jsx-runtime", jsxRuntime],
	["react/jsx-dev-runtime", jsxRuntime],
]) as ReadonlyMap<string, unknown>;

type ParentModule = {
	filename: string;
	paths: readonly string[];
} | null;

interface ResolveOptions {
	readonly paths?: readonly string[];
}

type InternalModule = typeof Module & {
	_load: LoadFn;
	_resolveFilename: ResolveFn;
};

type LoadFn = (
	request: string,
	parent: ParentModule,
	isMain: boolean,
) => unknown;

type ResolveFn = (
	request: string,
	parent: ParentModule,
	isMain: boolean,
	options?: ResolveOptions,
) => string;

const internal = Module as unknown as InternalModule;

const originalLoad: LoadFn = internal._load;
const originalResolveFilename: ResolveFn = internal._resolveFilename;

const CACHE_KEY_PREFIX = "__clutch_rewrite__:";
const cachedModules: Map<string, unknown> = new Map();

for (const [from, replacement] of REWRITE_MAP) {
	const cacheKey = `${CACHE_KEY_PREFIX}${from}`;
	cachedModules.set(cacheKey, replacement);
}

function normalizeRequest(request: unknown): string | null {
	if (typeof request === "string") {
		return request.split("?")[0];
	}
	if (request instanceof URL) {
		return request.pathname;
	}
	return null;
}

internal._resolveFilename = function (
	request: unknown,
	parent: ParentModule,
	isMain: boolean,
	options?: ResolveOptions,
): string {
	if (typeof request !== "string" && !(request instanceof URL)) {
		return request as string;
	}

	const base = normalizeRequest(request);
	if (base === null) {
		return request as string;
	}

	for (const [from] of REWRITE_MAP) {
		if (base === from) {
			console.error(
				"[HOOK] _resolveFilename exact:",
				base,
				"=>",
				`${CACHE_KEY_PREFIX}${from}`,
			);
			return `${CACHE_KEY_PREFIX}${from}`;
		}
	}

	for (const [from] of REWRITE_MAP) {
		if (base.startsWith(`${from}/`)) {
			console.error(
				"[HOOK] _resolveFilename prefix:",
				base,
				"=>",
				`${CACHE_KEY_PREFIX}${from}`,
			);
			return `${CACHE_KEY_PREFIX}${from}`;
		}
	}

	return originalResolveFilename.call(this, base, parent, isMain, options);
};

internal._load = function (
	request: unknown,
	parent: ParentModule,
	isMain: boolean,
): unknown {
	const base = normalizeRequest(request);

	if (typeof request === "string" && request.startsWith(CACHE_KEY_PREFIX)) {
		const cached = cachedModules.get(request);
		if (cached !== undefined) {
			console.error(
				"[HOOK] _load cache hit:",
				request,
				"=>",
				typeof cached,
				Object.keys(cached as object),
			);
			return cached;
		}
	}

	if (base === null) {
		return originalLoad.call(this, request as string, parent, isMain);
	}

	for (const [from, replacement] of REWRITE_MAP) {
		if (base === from) {
			console.error(
				"[HOOK] _load exact:",
				base,
				"=>",
				typeof replacement,
				replacement ? Object.keys(replacement as object) : "null",
			);
			return replacement;
		}
	}

	for (const [from, replacement] of REWRITE_MAP) {
		if (base.startsWith(`${from}/`)) {
			console.error(
				"[HOOK] _load prefix:",
				base,
				"=>",
				typeof replacement,
				replacement ? Object.keys(replacement as object) : "null",
			);
			return replacement;
		}
	}

	return originalLoad.call(this, base, parent, isMain);
};

export {
	loadExtension,
	type ExtensionModule,
	type LoadedExtension,
} from "./runtime/loader";

export {
	createRuntimeManager,
	type RuntimeManager,
	type RuntimeManagerConfig,
} from "./runtime/manager";

export {
	createSocketClient,
	type SocketClient,
	type SocketClientConfig,
} from "./socket/client";

export {
	createReconciler,
	type JsonRendererAPI,
} from "./reconciler";

export type { JSONNode } from "./reconciler/types";

export {
	executeHandler,
	clearExtensionHandlers,
} from "./reconciler/handler-registry";

export * from "./socket/protocol";
