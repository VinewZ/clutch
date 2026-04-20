import type { Action, JSONNode, RenderRequestMessage, RuntimeEventMessage, RuntimeStartMessage, SocketResponse } from "../socket/protocol";
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
export declare function createSocketBridge(config: SocketBridgeConfig): SocketBridge;
export declare function handleRuntimeEvent(message: RuntimeEventMessage): Promise<SocketResponse<Action>>;
export declare function createRuntimeEventHandler(sendResponse: (response: SocketResponse) => void): (message: RuntimeEventMessage) => Promise<void>;
export declare function createRenderRequestHandler(render: (extensionId: string, state: unknown) => JSONNode, sendResponse: (response: SocketResponse) => void): (message: RenderRequestMessage) => Promise<void>;
export declare function createRuntimeStartHandler(loadExtension: (extensionPath: string, command: string) => Promise<void>, sendResponse: (response: SocketResponse) => void): (message: RuntimeStartMessage) => Promise<void>;
export declare function createRuntimeStopHandler(sendResponse: (response: SocketResponse) => void): (extensionId: string) => Promise<void>;
//# sourceMappingURL=socket-bridge.d.ts.map