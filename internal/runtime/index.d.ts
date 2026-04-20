export declare const REWRITE_MAP: ReadonlyMap<string, unknown>;
export { loadExtension, type ExtensionModule, type LoadedExtension, } from "./runtime/loader";
export { createRuntimeManager, type RuntimeManager, type RuntimeManagerConfig, } from "./runtime/manager";
export { createSocketClient, type SocketClient, type SocketClientConfig, } from "./socket/client";
export { createReconciler, resetState, type JsonRendererAPI, } from "./reconciler";
export type { JSONNode } from "./reconciler/types";
export { executeHandler, clearExtensionHandlers, } from "./reconciler/handler-registry";
export * from "./socket/protocol";
//# sourceMappingURL=index.d.ts.map