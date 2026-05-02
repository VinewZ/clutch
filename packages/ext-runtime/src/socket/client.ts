import net from "node:net";
import type { BaseMessage, SocketResponse } from "./protocol";

export interface SocketClientConfig {
	socketPath: string;
	timeout?: number;
}

export interface SocketClient {
	connect(): Promise<void>;
	send<T extends BaseMessage, R>(message: T): Promise<SocketResponse<R>>;
	sendNoWait(msg: BaseMessage): boolean;
	onMessage(handler: (data: unknown) => void): void;
	removeMessageHandler(handler: (data: unknown) => void): void;
	close(): void;
	isConnected(): boolean;
}

interface PendingResponse {
	resolve: (response: SocketResponse) => void;
	reject: (error: Error) => void;
	timeout: NodeJS.Timeout;
}

function isSocketResponse(obj: unknown): obj is SocketResponse {
	return typeof obj === "object" && obj !== null && "success" in obj;
}

export function createSocketClient(config: SocketClientConfig): SocketClient {
	let socket: net.Socket | null = null;
	let connected = false;
	let buffer = "";
	const messageHandlers: Set<(data: unknown) => void> = new Set();
	const pendingResponses: PendingResponse[] = [];

	function processLine(jsonStr: string): void {
		let parsed: unknown;
		try {
			parsed = JSON.parse(jsonStr);
		} catch {
			console.error("[SOCKET] Failed to parse message:", jsonStr.slice(0, 100));
			return;
		}

		if (isSocketResponse(parsed)) {
			if (pendingResponses.length > 0) {
				const pending = pendingResponses.shift()!;
				clearTimeout(pending.timeout);
				pending.resolve(parsed);
			}
			return;
		}

		for (const handler of messageHandlers) {
			handler(parsed);
		}
	}

	return {
		async connect(): Promise<void> {
			return new Promise((resolve, reject) => {
				console.error("[SOCKET] Creating connection to:", config.socketPath);
				socket = net.createConnection(config.socketPath);

				const connectTimeout = setTimeout(() => {
					console.error("[SOCKET] Connection timeout");
					socket?.destroy();
					reject(new Error("Connection timeout"));
				}, config.timeout ?? 5000);

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

				socket.on("data", (data: Buffer) => {
					buffer += data.toString();

					let newlineIndex = buffer.indexOf("\n");
					while (newlineIndex !== -1) {
						const jsonStr = buffer.slice(0, newlineIndex);
						buffer = buffer.slice(newlineIndex + 1);
						processLine(jsonStr);
						newlineIndex = buffer.indexOf("\n");
					}
				});

				socket.on("close", () => {
					console.error("[SOCKET] Connection closed");
					connected = false;
					socket = null;
					for (const pending of pendingResponses) {
						clearTimeout(pending.timeout);
						pending.reject(new Error("Socket closed"));
					}
					pendingResponses.length = 0;
				});

				socket.on("error", () => {
					console.error("[SOCKET] Socket error event");
					connected = false;
				});
			});
		},

		async send<T extends BaseMessage, R>(msg: T): Promise<SocketResponse<R>> {
			return new Promise((resolve, reject) => {
				if (!socket || !connected) {
					console.error("[SOCKET] Cannot send - not connected");
					reject(new Error("Socket not connected"));
					return;
				}

				console.error(
					"[SOCKET] Sending message:",
					JSON.stringify(msg).slice(0, 200),
				);

				const sendTimeout = setTimeout(() => {
					const idx = pendingResponses.findIndex(
						(p) => p.resolve === pendingResolve,
					);
					if (idx !== -1) pendingResponses.splice(idx, 1);
					console.error("[SOCKET] Send timeout");
					reject(new Error("Response timeout"));
				}, config.timeout ?? 5000);

				let pendingResolve: (response: SocketResponse) => void;
				const pending: PendingResponse = {
					resolve: (response: SocketResponse) => {
						resolve(response as SocketResponse<R>);
					},
					reject,
					timeout: sendTimeout,
				};
				pendingResolve = pending.resolve;
				pendingResponses.push(pending);

				const jsonStr = `${JSON.stringify(msg)}\n`;
				socket.write(jsonStr, (err) => {
					if (err) {
						const idx = pendingResponses.indexOf(pending);
						if (idx !== -1) pendingResponses.splice(idx, 1);
						clearTimeout(sendTimeout);
						console.error("[SOCKET] Write error:", err.message);
						reject(err);
					}
				});
			});
		},

		onMessage(handler: (data: unknown) => void): void {
			messageHandlers.add(handler);
		},

		sendNoWait(msg: BaseMessage): boolean {
			if (!socket || !connected) return false;
			const jsonStr = `${JSON.stringify(msg)}\n`;
			socket.write(jsonStr);
			return true;
		},

		removeMessageHandler(handler: (data: unknown) => void): void {
			messageHandlers.delete(handler);
		},

		close(): void {
			if (socket) {
				console.error("[SOCKET] Closing socket");
				socket.destroy();
				socket = null;
				connected = false;
			}
			for (const pending of pendingResponses) {
				clearTimeout(pending.timeout);
				pending.reject(new Error("Socket closed"));
			}
			pendingResponses.length = 0;
			messageHandlers.clear();
		},

		isConnected(): boolean {
			return connected && socket !== null;
		},
	};
}
