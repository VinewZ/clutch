import type { BaseMessage, SocketResponse } from "./protocol";
export interface SocketClientConfig {
    socketPath: string;
    timeout?: number;
}
export interface SocketClient {
    connect(): Promise<void>;
    send<T extends BaseMessage, R>(message: T): Promise<SocketResponse<R>>;
    onMessage(handler: (data: unknown) => void): void;
    removeMessageHandler(handler: (data: unknown) => void): void;
    close(): void;
    isConnected(): boolean;
}
export declare function createSocketClient(config: SocketClientConfig): SocketClient;
//# sourceMappingURL=client.d.ts.map