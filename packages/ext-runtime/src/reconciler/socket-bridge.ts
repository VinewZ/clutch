import type { SocketClient } from "../socket/client";
import { createSocketClient } from "../socket/client";
import type {
	Action,
	JSONNode,
	RenderRequestMessage,
	RuntimeEventMessage,
	RuntimeStartMessage,
	SocketResponse,
} from "../socket/protocol";
import { clearExtensionHandlers, executeHandler } from "./handler-registry";
import { clearExtensionContext, setExtensionContext } from "./host-config";
import { resetIdCounter } from "./utils";

export interface SocketBridgeConfig {
	socketPath: string;
	onRender?: (extensionId: string, json: JSONNode) => void;
	onError?: (error: Error) => void;
}

export interface SocketBridge {
	start(): Promise<void>;
	stop(): Promise<void>;
	isConnected(): boolean;
}

export function createSocketBridge(config: SocketBridgeConfig): SocketBridge {
	let client: SocketClient | null = null;

	return {
		async start(): Promise<void> {
			client = createSocketClient({
				socketPath: config.socketPath,
				timeout: 5000,
			});

			await client.connect();
		},

		async stop(): Promise<void> {
			client?.close();
			client = null;
		},

		isConnected(): boolean {
			return client?.isConnected() ?? false;
		},
	};
}

export async function handleRuntimeEvent(
	message: RuntimeEventMessage,
): Promise<SocketResponse<Action>> {
	try {
		const action = await executeHandler(message.handlerId, message.event);
		return {
			success: true,
			data: action,
		};
	} catch (error) {
		return {
			success: false,
			error: {
				code: "HANDLER_ERROR",
				message: error instanceof Error ? error.message : "Unknown error",
			},
		};
	}
}

export function createRuntimeEventHandler(
	sendResponse: (response: SocketResponse) => void,
) {
	return async (message: RuntimeEventMessage): Promise<void> => {
		const response = await handleRuntimeEvent(message);
		sendResponse(response);
	};
}

export function createRenderRequestHandler(
	render: (extensionId: string, state: unknown) => JSONNode,
	sendResponse: (response: SocketResponse) => void,
) {
	return async (message: RenderRequestMessage): Promise<void> => {
		try {
			setExtensionContext(message.extensionId);
			resetIdCounter();

			const json = render(message.extensionId, message.state);

			const response: SocketResponse<{ json: JSONNode }> = {
				success: true,
				data: { json },
			};

			sendResponse(response);
		} catch (error) {
			sendResponse({
				success: false,
				error: {
					code: "RENDER_ERROR",
					message: error instanceof Error ? error.message : "Unknown error",
				},
			});
		} finally {
			clearExtensionContext();
		}
	};
}

export function createRuntimeStartHandler(
	loadExtension: (extensionPath: string, command: string) => Promise<void>,
	sendResponse: (response: SocketResponse) => void,
) {
	return async (message: RuntimeStartMessage): Promise<void> => {
		try {
			await loadExtension(message.extensionPath, message.extensionCommand);

			sendResponse({
				success: true,
				data: { extensionId: message.extensionId },
			});
		} catch (error) {
			sendResponse({
				success: false,
				error: {
					code: "START_ERROR",
					message: error instanceof Error ? error.message : "Unknown error",
				},
			});
		}
	};
}

export function createRuntimeStopHandler(
	sendResponse: (response: SocketResponse) => void,
) {
	return async (extensionId: string): Promise<void> => {
		try {
			clearExtensionHandlers(extensionId);
			clearExtensionContext();

			sendResponse({
				success: true,
				data: { extensionId },
			});
		} catch (error) {
			sendResponse({
				success: false,
				error: {
					code: "STOP_ERROR",
					message: error instanceof Error ? error.message : "Unknown error",
				},
			});
		}
	};
}
