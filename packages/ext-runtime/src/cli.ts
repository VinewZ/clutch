import "./index";
import {
	clearExtensionHandlers,
	createReconciler,
	createSocketClient,
	executeHandler,
	loadExtension,
	type BaseMessage,
	type JSONNode,
	type LoadedExtension,
} from "./index";
import React from "react";
import { clutch } from "@clutch/api";

interface CliArgs {
	socket: string;
	extensionId: string;
	extensionPath: string;
	command: string;
	preferences: Record<string, unknown>;
}

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);
	const result: Record<string, string> = {};

	for (let i = 0; i < args.length; i += 2) {
		const key = args[i]?.replace(/^--/, "") ?? "";
		const value = args[i + 1] ?? "";
		if (key && value) {
			result[key] = value;
		}
	}

	// Parse preferences JSON if provided
	let preferences: Record<string, unknown> = {};
	if (result.preferences) {
		try {
			preferences = JSON.parse(result.preferences) as Record<string, unknown>;
			console.error("[CLI] Parsed preferences:", JSON.stringify(preferences));
		} catch (err) {
			console.error(
				"[CLI] Failed to parse preferences JSON:",
				err instanceof Error ? err.message : "Unknown error",
			);
		}
	}

	return {
		socket: result.socket ?? "",
		extensionId: result["extension-id"] ?? "",
		extensionPath: result["extension-path"] ?? "",
		command: result.command ?? "",
		preferences,
	};
}

async function main() {
	const args = parseArgs();
	console.error("[CLI] Parsed arguments:", JSON.stringify(args, null, 2));

	if (
		!args.socket ||
		!args.extensionId ||
		!args.extensionPath ||
		!args.command
	) {
		console.error("Missing required arguments");
		console.error(
			"Usage: cli.cjs --socket <path> --extension-id <id> --extension-path <path> --command <name>",
		);
		process.exit(1);
	}

	console.error("[CLI] Creating socket client...");
	const client = createSocketClient({
		socketPath: args.socket,
		timeout: 10000,
	});

	let isShuttingDown = false;

	const shutdown = async (signal: string) => {
		if (isShuttingDown) return;
		isShuttingDown = true;

		console.error(`[CLI] Received ${signal}, shutting down...`);

		delete (globalThis as unknown as Record<string, unknown>)
			.__clutchSocketSend;
		delete (globalThis as unknown as Record<string, unknown>)
			.__clutchExtensionId;

		clearExtensionHandlers(args.extensionId);

		client.close();
		process.exit(0);
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));

	console.error("[CLI] Attempting to connect to socket:", args.socket);
	try {
		await client.connect();
		console.error("[CLI] Socket connected successfully");
	} catch (err) {
		const errMsg = err instanceof Error ? err.message : "Unknown error";
		console.error("[CLI] Failed to connect to socket:", errMsg);
		process.exit(1);
	}

	(globalThis as unknown as Record<string, unknown>).__clutchSocketSend = (
		msg: Record<string, unknown>,
	) => {
		if (client.isConnected()) {
			client
				.send<BaseMessage, void>(msg as unknown as BaseMessage)
				.catch((err: unknown) => {
					console.error(
						"[CLI] Failed to send toast message:",
						err instanceof Error ? err.message : err,
					);
				});
		}
	};
	(globalThis as unknown as Record<string, unknown>).__clutchExtensionId =
		args.extensionId;

	const sendError = async (code: string, message: string) => {
		console.error(`[CLI] [${code}] ${message}`);
		try {
			await client.send<BaseMessage, void>({
				category: "INTERNAL",
				type: "error",
			} as BaseMessage);
		} catch {
			// Ignore send errors during error reporting
		}
	};

	let loadedExtension: LoadedExtension | null = null;
	let reconciler: ReturnType<typeof createReconciler> | null = null;

	console.error(
		"[CLI] Loading extension from path:",
		args.extensionPath,
		"command:",
		args.command,
	);

	// Initialize preferences before loading extension
	if (Object.keys(args.preferences).length > 0) {
		console.error("[CLI] Initializing preferences from CLI args");
		clutch.api.initializePreferences(args.preferences);
	}

	try {
		loadedExtension = await loadExtension(args.extensionPath, args.command);
		console.error("[CLI] Extension loaded successfully:", loadedExtension.id);
	} catch (err) {
		const errMsg = err instanceof Error ? err.message : "Unknown error";
		console.error("[CLI] Failed to load extension:", errMsg);
		await sendError("LOAD_ERROR", `Failed to load extension: ${errMsg}`);
		client.close();
		process.exit(1);
	}

	console.error("[CLI] Creating reconciler...");
	try {
		reconciler = createReconciler({
			onUpdate: (json: JSONNode | null) => {
				console.error(
					"[CLI] Reconciler onUpdate called, json:",
					json ? "present" : "null",
				);
				if (json && client.isConnected()) {
					console.error(
						"[CLI] Sending renderResponse:",
						JSON.stringify(json).slice(0, 200),
					);
					client
						.send<BaseMessage, void>({
							category: "RENDER",
							type: "renderResponse",
							extensionId: loadedExtension!.id,
							json,
						} as BaseMessage)
						.catch((err) => {
							console.error(
								"[CLI] Failed to send render:",
								err instanceof Error ? err.message : err,
							);
						});
				}
			},
		});

		console.error("[CLI] Rendering initial component...");
		const NavigationProvider = clutch.api.NavigationProvider;
		const ToastProvider = clutch.api.ToastProvider;
		console.error("[CLI] NavigationProvider:", NavigationProvider);
		console.error("[CLI] ToastProvider:", ToastProvider);
		console.error(
			"[CLI] loadedExtension.component:",
			loadedExtension!.component,
		);
		console.error(
			"[CLI] loadedExtension.component type:",
			loadedExtension!.component?.type,
		);

		const wrappedComponent = React.createElement(
			ToastProvider,
			null,
			React.createElement(NavigationProvider, null, loadedExtension!.component),
		);
		console.error("[CLI] wrappedComponent:", wrappedComponent);
		console.error("[CLI] wrappedComponent type:", wrappedComponent.type);
		console.error(
			"[CLI] wrappedComponent $$typeof:",
			(wrappedComponent as any).$$typeof,
		);

		const initialJson = reconciler.render(wrappedComponent);
		console.error(
			"[CLI] Initial render result:",
			initialJson ? JSON.stringify(initialJson).slice(0, 200) : "null",
		);

		if (initialJson && client.isConnected()) {
			console.error("[CLI] Sending initial renderResponse...");
			await client.send<BaseMessage, void>({
				category: "RENDER",
				type: "renderResponse",
				extensionId: loadedExtension.id,
				json: initialJson,
			} as BaseMessage);
			console.error("[CLI] Initial renderResponse sent successfully");
		}
	} catch (err) {
		const errMsg = err instanceof Error ? err.message : "Unknown error";
		console.error("[CLI] Failed to render extension:", errMsg);
		await sendError("RENDER_ERROR", `Failed to render extension: ${errMsg}`);
		client.close();
		process.exit(1);
	}

	console.error("[CLI] Setting up message handler...");
	client.onMessage(async (data: unknown) => {
		if (isShuttingDown) return;

		const msg = data as BaseMessage;
		console.error("[CLI] Received message:", JSON.stringify(msg).slice(0, 200));

		if (msg.category === "RUNTIME" && msg.type === "event") {
			const eventMsg = data as BaseMessage & {
				handlerId: string;
				event: unknown;
			};
			console.error("[CLI] Processing event:", eventMsg.handlerId);

			try {
				const action = await executeHandler(
					eventMsg.handlerId,
					eventMsg.event as Parameters<typeof executeHandler>[1],
				);
				await client.send<BaseMessage, void>({
					category: "RUNTIME",
					type: "action",
					extensionId: loadedExtension!.id,
					action,
				} as BaseMessage);
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : "Unknown error";
				console.error("[CLI] Handler error:", errMsg);
				await client.send<BaseMessage, void>({
					category: "RUNTIME",
					type: "action",
					extensionId: loadedExtension!.id,
					action: { type: "error", payload: { message: errMsg } },
				} as BaseMessage);
			}
		}

		if (msg.category === "RUNTIME" && msg.type === "navigationPop") {
			console.error("[CLI] Handling navigationPop");
			const navigationPop = (globalThis as unknown as Record<string, unknown>)
				.__clutchNavigationPop;
			if (typeof navigationPop === "function") {
				navigationPop();
			}
		}

		if (msg.category === "INTERNAL" && msg.type === "runtimeStop") {
			await shutdown("runtimeStop");
		}
	});

	console.error("[CLI] Extension runtime ready, waiting for messages...");
}

main().catch((err) => {
	console.error("[CLI] Fatal error:", err instanceof Error ? err.message : err);
	process.exit(1);
});
