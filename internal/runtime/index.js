import Module from "node:module";
import React from "react";
import { clutch } from "@clutch/api";
export const REWRITE_MAP = new Map([
    ["@raycast/api", clutch.api],
    ["react", React],
    ["react/jsx-runtime", React],
    ["react/jsx-dev-runtime", React],
]);
const internal = Module;
const originalLoad = internal._load;
const originalResolveFilename = internal._resolveFilename;
const CACHE_KEY_PREFIX = "__clutch_rewrite__:";
const cachedModules = new Map();
for (const [from, replacement] of REWRITE_MAP) {
    const cacheKey = `${CACHE_KEY_PREFIX}${from}`;
    cachedModules.set(cacheKey, replacement);
}
function normalizeRequest(request) {
    if (typeof request === "string") {
        return request.split("?")[0];
    }
    if (request instanceof URL) {
        return request.pathname;
    }
    return null;
}
internal._resolveFilename = function (request, parent, isMain, options) {
    if (typeof request !== "string" && !(request instanceof URL)) {
        return request;
    }
    const base = normalizeRequest(request);
    if (base === null) {
        return request;
    }
    for (const [from] of REWRITE_MAP) {
        if (base === from || base.startsWith(`${from}/`)) {
            return `${CACHE_KEY_PREFIX}${from}`;
        }
    }
    return originalResolveFilename.call(this, base, parent, isMain, options);
};
internal._load = function (request, parent, isMain) {
    const base = normalizeRequest(request);
    if (typeof request === "string" && request.startsWith(CACHE_KEY_PREFIX)) {
        const cached = cachedModules.get(request);
        if (cached !== undefined) {
            return cached;
        }
    }
    if (base === null) {
        return originalLoad.call(this, request, parent, isMain);
    }
    for (const [from, replacement] of REWRITE_MAP) {
        if (base === from || base.startsWith(`${from}/`)) {
            return replacement;
        }
    }
    return originalLoad.call(this, base, parent, isMain);
};
export { loadExtension, } from "./runtime/loader";
export { createRuntimeManager, } from "./runtime/manager";
export { createSocketClient, } from "./socket/client";
export { createReconciler, resetState, } from "./reconciler";
export { executeHandler, clearExtensionHandlers, } from "./reconciler/handler-registry";
export * from "./socket/protocol";
//# sourceMappingURL=index.js.map