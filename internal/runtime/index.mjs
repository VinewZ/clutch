import Module from "node:module";
import { COMPAT } from "@clutch/compat-layer";
import { pathToFileURL } from "node:url";
import ReactReconciler from "react-reconciler";
import net from "node:net";
//#region src/runtime/react-injector.ts
const React$1 = COMPAT.react;
let isInjected = false;
function injectReact() {
	if (isInjected) return;
	isInjected = true;
	console.error("[REACT-INJECTOR] injectReact() called - React injection is handled by REWRITE_MAP in index.ts");
	console.error("[REACT-INJECTOR] React module available:", !!React$1, "React.version:", React$1.version);
}
//#endregion
//#region src/runtime/loader.ts
const React = COMPAT.react;
async function loadExtension(extensionPath, command) {
	injectReact();
	const entryPath = `${extensionPath}/${command}.js`;
	console.error("[LOADER] Loading extension from:", entryPath);
	console.error("[LOADER] Extension path:", extensionPath);
	console.error("[LOADER] Command:", command);
	try {
		const moduleUrl = pathToFileURL(entryPath).href;
		console.error("[LOADER] Importing module from URL:", moduleUrl);
		const module = await import(pathToFileURL(entryPath).href);
		console.error("[LOADER] Module imported successfully");
		console.error("[LOADER] Module exports:", Object.keys(module));
		console.error("[LOADER] Module default type:", typeof module.default);
		let component;
		let defaultExport = module.default;
		if (defaultExport && typeof defaultExport === "object" && "default" in defaultExport && !React.isValidElement(defaultExport)) {
			console.error("[LOADER] Unwrapping nested module.default");
			defaultExport = defaultExport.default;
		}
		console.error("[LOADER] defaultExport:", defaultExport);
		console.error("[LOADER] defaultExport.$$typeof:", defaultExport?.$$typeof?.toString());
		console.error("[LOADER] defaultExport.type:", defaultExport?.type);
		console.error("[LOADER] defaultExport.props:", defaultExport?.props);
		if (React.isValidElement(defaultExport)) {
			console.error("[LOADER] Default export is already a React element");
			console.error("[LOADER] Element type:", defaultExport.type);
			console.error("[LOADER] Element props:", JSON.stringify(defaultExport.props).slice(0, 300));
			component = defaultExport;
		} else if (typeof defaultExport === "function") {
			console.error("[LOADER] Default export is a function component, wrapping with createElement");
			console.error("[LOADER] Function name:", defaultExport.name || "anonymous");
			console.error("[LOADER] Calling React.createElement...");
			component = React.createElement(defaultExport);
			console.error("[LOADER] Created element, type:", component.type);
		} else {
			console.error("[LOADER] Default export is unknown type, wrapping with createElement");
			const Wrapper = () => defaultExport;
			component = React.createElement(Wrapper);
		}
		console.error("[LOADER] Component resolved, isValidElement:", React.isValidElement(component));
		const extensionId = `${extensionPath.split("/").pop()}-${command}`;
		console.error("[LOADER] Generated extension ID:", extensionId);
		return {
			id: extensionId,
			path: extensionPath,
			command,
			module,
			component
		};
	} catch (error) {
		console.error("[LOADER] Failed to load extension:", error);
		throw new Error(`Failed to load extension at ${entryPath}: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}
//#endregion
//#region src/reconciler/handler-registry.ts
var HandlerRegistry = class {
	handlers = /* @__PURE__ */ new Map();
	counter = 0;
	register(extensionId, handler) {
		const handlerId = `handler_${this.counter++}`;
		this.handlers.set(handlerId, {
			handler,
			extensionId
		});
		return handlerId;
	}
	get(handlerId) {
		return this.handlers.get(handlerId)?.handler;
	}
	async execute(handlerId, event) {
		const handlerInfo = this.handlers.get(handlerId);
		if (!handlerInfo) throw new Error(`Handler not found: ${handlerId}`);
		const result = handlerInfo.handler(event);
		if (result instanceof Promise) return await result;
		return result;
	}
	has(handlerId) {
		return this.handlers.has(handlerId);
	}
	remove(handlerId) {
		return this.handlers.delete(handlerId);
	}
	clearExtension(extensionId) {
		for (const [id, info] of this.handlers.entries()) if (info.extensionId === extensionId) this.handlers.delete(id);
	}
	clear() {
		this.handlers.clear();
		this.counter = 0;
	}
	getExtensionHandlers(extensionId) {
		const ids = [];
		for (const [id, info] of this.handlers.entries()) if (info.extensionId === extensionId) ids.push(id);
		return ids;
	}
};
const handlerRegistry = new HandlerRegistry();
function registerHandler(extensionId, handler) {
	return handlerRegistry.register(extensionId, handler);
}
function executeHandler(handlerId, event) {
	return handlerRegistry.execute(handlerId, event);
}
function clearExtensionHandlers(extensionId) {
	handlerRegistry.clearExtension(extensionId);
}
//#endregion
//#region src/reconciler/props-transformer.ts
const EVENT_HANDLER_REGEX = /^on[A-Z]/;
function isEventHandler(key) {
	return EVENT_HANDLER_REGEX.test(key);
}
function isHandlerFunction(value) {
	return typeof value === "function";
}
function isHandlerReference(value) {
	return typeof value === "object" && value !== null && "$handler" in value;
}
function transformProps(props, options) {
	const result = {};
	const { extensionId, handlers } = options;
	for (const [key, value] of Object.entries(props)) {
		if (key === "children" || key === "key" || key === "ref") {
			result[key] = value;
			continue;
		}
		if (isEventHandler(key) && isHandlerFunction(value)) {
			const handlerId = registerHandler(extensionId, value);
			if (handlers) handlers.set(handlerId, value);
			result[key] = { $handler: handlerId };
			continue;
		}
		if (isEventHandler(key) && isHandlerReference(value)) {
			result[key] = value;
			continue;
		}
		result[key] = value;
	}
	return result;
}
//#endregion
//#region src/reconciler/utils.ts
let nodeIdCounter = 0;
function generateId() {
	return `node_${nodeIdCounter++}`;
}
function getComponentName(type) {
	if (typeof type === "string") return type;
	if (typeof type === "function") {
		const func = type;
		return func.displayName || func.name || "Anonymous";
	}
	if (typeof type === "object" && type !== null) return type.displayName || "Anonymous";
	return "Unknown";
}
const INTERNAL_PROPS = new Set([
	"ref",
	"key",
	"children"
]);
function extractProps(props) {
	const result = {};
	for (const key of Object.keys(props)) if (!INTERNAL_PROPS.has(key)) result[key] = props[key];
	return result;
}
//#endregion
//#region src/reconciler/host-config.ts
let currentExtensionId = null;
let pendingOutput = false;
function setExtensionContext(extensionId) {
	console.error("[HOST-CONFIG] setExtensionContext:", extensionId);
	currentExtensionId = extensionId;
}
function clearExtensionContext() {
	console.error("[HOST-CONFIG] clearExtensionContext");
	currentExtensionId = null;
}
function scheduleJsonOutput(container) {
	if (pendingOutput) return;
	pendingOutput = true;
	queueMicrotask(() => {
		pendingOutput = false;
		container.version++;
		console.error("[HOST-CONFIG] scheduleJsonOutput - notifying", container.listeners.size, "listeners");
		for (const listener of container.listeners) listener(container.root);
	});
}
//#endregion
//#region src/reconciler/index.ts
const reconciler = ReactReconciler({
	supportsMutation: true,
	supportsPersistence: false,
	supportsHydration: false,
	isPrimaryRenderer: false,
	createInstance(type, props, _rootContainer, _hostContext, _internalHandle) {
		const typeName = getComponentName(type);
		console.error("[HOST-CONFIG] ========== createInstance ==========");
		console.error("[HOST-CONFIG] Type:", typeName);
		console.error("[HOST-CONFIG] Props keys:", Object.keys(props));
		console.error("[HOST-CONFIG] Props:", JSON.stringify(props).slice(0, 300));
		const instance = {
			type: typeName,
			props: extractProps(currentExtensionId ? transformProps(props, { extensionId: currentExtensionId }) : props),
			children: [],
			id: generateId()
		};
		console.error("[HOST-CONFIG] Created instance:", JSON.stringify(instance).slice(0, 300));
		return instance;
	},
	createTextInstance(text, _rootContainer, _hostContext, _internalHandle) {
		console.error("[HOST-CONFIG] createTextInstance:", text.slice(0, 100));
		return text;
	},
	appendInitialChild(parentInstance, child) {
		parentInstance.children.push(child);
	},
	finalizeInitialChildren(_instance, _type, _props, _rootContainer, _hostContext) {
		return false;
	},
	shouldSetTextContent(_type, _props) {
		return false;
	},
	getRootHostContext(_rootContainer) {
		return null;
	},
	getChildHostContext(parentHostContext, _type, _rootContainer) {
		return parentHostContext;
	},
	getPublicInstance(instance) {
		return instance;
	},
	prepareForCommit(_containerInfo) {
		return null;
	},
	resetAfterCommit(container) {
		scheduleJsonOutput(container);
	},
	preparePortalMount(_containerInfo) {},
	scheduleTimeout: setTimeout,
	cancelTimeout: clearTimeout,
	noTimeout: -1,
	supportsMicrotasks: true,
	scheduleMicrotask: queueMicrotask,
	getInstanceFromNode(_node) {
		return null;
	},
	beforeActiveInstanceBlur() {},
	afterActiveInstanceBlur() {},
	prepareScopeUpdate(_scopeInstance, _instance) {},
	getInstanceFromScope(_scopeInstance) {
		return null;
	},
	detachDeletedInstance(_node) {},
	appendChild(parentInstance, child) {
		parentInstance.children.push(child);
	},
	appendChildToContainer(container, child) {
		console.error("[HOST-CONFIG] appendChildToContainer:", child.type);
		container.root = child;
		scheduleJsonOutput(container);
	},
	insertBefore(parentInstance, child, beforeChild) {
		const index = parentInstance.children.indexOf(beforeChild);
		if (index !== -1) parentInstance.children.splice(index, 0, child);
		else parentInstance.children.push(child);
	},
	insertInContainerBefore(container, child, _beforeChild) {
		container.root = child;
		scheduleJsonOutput(container);
	},
	removeChild(parentInstance, child) {
		const index = parentInstance.children.indexOf(child);
		if (index !== -1) parentInstance.children.splice(index, 1);
	},
	removeChildFromContainer(container, _child) {
		container.root = null;
		scheduleJsonOutput(container);
	},
	resetTextContent(_instance) {},
	commitTextUpdate(_textInstance, _oldText, newText) {
		return newText;
	},
	commitMount(_instance, _type, _newProps, _internalInstanceHandle) {},
	commitUpdate(instance, _type, _prevProps, newProps, _internalHandle) {
		instance.props = extractProps(currentExtensionId ? transformProps(newProps, { extensionId: currentExtensionId }) : newProps);
	},
	hideInstance(_instance) {},
	hideTextInstance(_textInstance) {},
	unhideInstance(_instance, _props) {},
	unhideTextInstance(_textInstance, _text) {},
	clearContainer(container) {
		container.root = null;
	},
	NotPendingTransition: null,
	HostTransitionContext: {},
	setCurrentUpdatePriority(_newPriority) {},
	getCurrentUpdatePriority() {
		return 0;
	},
	resolveUpdatePriority() {
		return 0;
	},
	resetFormInstance(_form) {},
	requestPostPaintCallback(_callback) {},
	shouldAttemptEagerTransition() {
		return false;
	},
	trackSchedulerEvent() {},
	resolveEventType() {
		return null;
	},
	resolveEventTimeStamp() {
		return 0;
	},
	maySuspendCommit(_type, _props) {
		return false;
	},
	preloadInstance(_type, _props) {
		return true;
	},
	startSuspendingCommit() {},
	suspendInstance(_type, _props) {},
	waitForCommitToBeReady() {
		return null;
	}
});
function createContainer() {
	return {
		root: null,
		listeners: /* @__PURE__ */ new Set(),
		version: 0
	};
}
function noop() {}
function createReconciler(options) {
	console.error("[RECONCILER] Creating reconciler with options:", !!options);
	const container = createContainer();
	if (options?.onUpdate) {
		console.error("[RECONCILER] Added onUpdate listener");
		container.listeners.add(options.onUpdate);
	}
	const root = reconciler.createContainer(container, 0, null, false, null, "", noop, noop, noop, noop);
	console.error("[RECONCILER] Container created, root:", !!root);
	return {
		render(element, _state) {
			console.error("[RECONCILER] ========== RENDER START ==========");
			console.error("[RECONCILER] render() called with element type:", typeof element);
			if (element === null || element === void 0) {
				console.error("[RECONCILER] Element is null/undefined, returning null");
				return null;
			}
			const elementAny = element;
			console.error("[RECONCILER] Element $$typeof:", elementAny?.$$typeof);
			console.error("[RECONCILER] Element type:", elementAny?.type);
			console.error("[RECONCILER] Element props:", elementAny?.props);
			try {
				console.error("[RECONCILER] Calling updateContainerSync...");
				reconciler.updateContainerSync(element, root, null, null);
				console.error("[RECONCILER] updateContainerSync returned");
				console.error("[RECONCILER] Calling flushSyncWork...");
				reconciler.flushSyncWork();
				console.error("[RECONCILER] flushSyncWork returned");
			} catch (err) {
				console.error("[RECONCILER] ERROR during render:", err instanceof Error ? err.message : err);
				console.error("[RECONCILER] Stack:", err instanceof Error ? err.stack : "N/A");
				throw err;
			}
			console.error("[RECONCILER] ========== RENDER END ==========");
			console.error("[RECONCILER] container.root:", !!container.root);
			console.error("[RECONCILER] container.root value:", JSON.stringify(container.root, null, 2).slice(0, 500));
			return container.root;
		},
		unmount() {
			console.error("[RECONCILER] unmount() called");
			reconciler.updateContainerSync(null, root, null, null);
			reconciler.flushSyncWork();
		}
	};
}
//#endregion
//#region src/runtime/manager.ts
function createRuntimeManager(config) {
	const extensions = /* @__PURE__ */ new Map();
	const renderers = /* @__PURE__ */ new Map();
	let activeExtensionId = null;
	return {
		async startExtension(extensionPath, command, initialState) {
			const loaded = await loadExtension(extensionPath, command);
			const renderer = createReconciler({ onUpdate: (json) => {
				if (json) config?.onRender?.(loaded.id, json);
			} });
			extensions.set(loaded.id, loaded);
			renderers.set(loaded.id, renderer);
			activeExtensionId = loaded.id;
			const json = renderer.render(loaded.component, initialState);
			if (!json) throw new Error("Initial render returned null");
			return json;
		},
		async stopExtension(extensionId) {
			const renderer = renderers.get(extensionId);
			if (renderer) {
				renderer.unmount();
				renderers.delete(extensionId);
			}
			extensions.delete(extensionId);
			clearExtensionHandlers(extensionId);
			if (activeExtensionId === extensionId) activeExtensionId = null;
		},
		async render(extensionId, state) {
			const renderer = renderers.get(extensionId);
			const extension = extensions.get(extensionId);
			if (!renderer || !extension) throw new Error(`Extension not found: ${extensionId}`);
			const json = renderer.render(extension.component, state);
			if (!json) throw new Error("Render returned null");
			return json;
		},
		getActiveExtension() {
			return activeExtensionId;
		}
	};
}
//#endregion
//#region src/socket/client.ts
function createSocketClient(config) {
	let socket = null;
	let connected = false;
	let buffer = "";
	const messageHandlers = /* @__PURE__ */ new Set();
	return {
		async connect() {
			return new Promise((resolve, reject) => {
				console.error("[SOCKET] Creating connection to:", config.socketPath);
				socket = net.createConnection(config.socketPath);
				const connectTimeout = setTimeout(() => {
					console.error("[SOCKET] Connection timeout");
					socket?.destroy();
					reject(/* @__PURE__ */ new Error("Connection timeout"));
				}, config.timeout ?? 5e3);
				socket.once("connect", () => {
					clearTimeout(connectTimeout);
					connected = true;
					console.error("[SOCKET] Connected successfully");
					resolve();
				});
				socket.once("error", (err) => {
					clearTimeout(connectTimeout);
					console.error("[SOCKET] Connection error:", err.message);
					reject(err);
				});
				socket.on("data", (data) => {
					buffer += data.toString();
					let newlineIndex = buffer.indexOf("\n");
					while (newlineIndex !== -1) {
						const jsonStr = buffer.slice(0, newlineIndex);
						buffer = buffer.slice(newlineIndex + 1);
						try {
							const parsed = JSON.parse(jsonStr);
							console.error("[SOCKET] Received message:", JSON.stringify(parsed).slice(0, 200));
							for (const handler of messageHandlers) handler(parsed);
						} catch {
							console.error("[SOCKET] Failed to parse message:", jsonStr.slice(0, 100));
						}
						newlineIndex = buffer.indexOf("\n");
					}
				});
				socket.on("close", () => {
					console.error("[SOCKET] Connection closed");
					connected = false;
					socket = null;
				});
				socket.on("error", () => {
					console.error("[SOCKET] Socket error event");
					connected = false;
				});
			});
		},
		async send(msg) {
			return new Promise((resolve, reject) => {
				if (!socket || !connected) {
					console.error("[SOCKET] Cannot send - not connected");
					reject(/* @__PURE__ */ new Error("Socket not connected"));
					return;
				}
				console.error("[SOCKET] Sending message:", JSON.stringify(msg).slice(0, 200));
				const sendTimeout = setTimeout(() => {
					console.error("[SOCKET] Send timeout");
					reject(/* @__PURE__ */ new Error("Response timeout"));
				}, config.timeout ?? 5e3);
				let localBuffer = "";
				const onData = (data) => {
					localBuffer += data.toString();
					const newlineIndex = localBuffer.indexOf("\n");
					if (newlineIndex !== -1) {
						const jsonStr = localBuffer.slice(0, newlineIndex);
						clearTimeout(sendTimeout);
						socket?.off("data", onData);
						try {
							const response = JSON.parse(jsonStr);
							console.error("[SOCKET] Received response:", JSON.stringify(response).slice(0, 200));
							resolve(response);
						} catch (err) {
							console.error("[SOCKET] Failed to parse response:", jsonStr.slice(0, 100));
							reject(/* @__PURE__ */ new Error(`Parse error: ${err}`));
						}
					}
				};
				socket.on("data", onData);
				const jsonStr = `${JSON.stringify(msg)}\n`;
				socket.write(jsonStr, (err) => {
					if (err) {
						clearTimeout(sendTimeout);
						socket?.off("data", onData);
						console.error("[SOCKET] Write error:", err.message);
						reject(err);
					}
				});
			});
		},
		onMessage(handler) {
			messageHandlers.add(handler);
		},
		removeMessageHandler(handler) {
			messageHandlers.delete(handler);
		},
		close() {
			if (socket) {
				console.error("[SOCKET] Closing socket");
				socket.destroy();
				socket = null;
				connected = false;
			}
			messageHandlers.clear();
		},
		isConnected() {
			return connected && socket !== null;
		}
	};
}
//#endregion
//#region src/index.ts
console.error("[INDEX] Module rewrite system initializing...");
const REWRITE_MAP = new Map([
	["@raycast/api", COMPAT.API],
	["react", COMPAT.react],
	["react/jsx-runtime", COMPAT.react],
	["react/jsx-dev-runtime", COMPAT.react]
]);
console.error("[INDEX] REWRITE_MAP entries:");
for (const [key] of REWRITE_MAP) console.error(`  - ${key}`);
const internal = Module;
const originalLoad = internal._load;
const originalResolveFilename = internal._resolveFilename;
const CACHE_KEY_PREFIX = "__clutch_rewrite__:";
const cachedModules = /* @__PURE__ */ new Map();
for (const [from, replacement] of REWRITE_MAP) {
	const cacheKey = `${CACHE_KEY_PREFIX}${from}`;
	cachedModules.set(cacheKey, replacement);
}
function normalizeRequest(request) {
	if (typeof request === "string") return request.split("?")[0];
	if (request instanceof URL) return request.pathname;
	return null;
}
internal._resolveFilename = function(request, parent, isMain, options) {
	if (typeof request !== "string" && !(request instanceof URL)) return request;
	const base = normalizeRequest(request);
	if (base === null) return request;
	for (const [from] of REWRITE_MAP) if (base === from || base.startsWith(`${from}/`)) return `${CACHE_KEY_PREFIX}${from}`;
	return originalResolveFilename.call(this, base, parent, isMain, options);
};
internal._load = function(request, parent, isMain) {
	const base = normalizeRequest(request);
	console.error("[INDEX._load] request:", request, "base:", base, "parent:", parent?.filename?.slice(0, 100));
	if (typeof request === "string" && request.startsWith(CACHE_KEY_PREFIX)) {
		const cached = cachedModules.get(request);
		if (cached !== void 0) {
			console.error("[INDEX._load] Returning cached module for:", request);
			return cached;
		}
	}
	if (base === null) return originalLoad.call(this, request, parent, isMain);
	for (const [from, replacement] of REWRITE_MAP) {
		if (base === from) {
			console.error("[INDEX._load] Rewriting:", base, "->", from);
			return replacement;
		}
		if (base.startsWith(`${from}/`)) {
			console.error("[INDEX._load] Rewriting (subpath):", base, "->", from);
			return replacement;
		}
	}
	return originalLoad.call(this, base, parent, isMain);
};
//#endregion
export { REWRITE_MAP, clearExtensionContext, clearExtensionHandlers, createReconciler, createRuntimeManager, createSocketClient, executeHandler, loadExtension, setExtensionContext };

//# sourceMappingURL=index.mjs.map