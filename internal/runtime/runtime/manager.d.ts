import type { JSONNode } from "../socket/protocol";
export interface RuntimeManagerConfig {
    onRender?: (extensionId: string, json: JSONNode) => void;
    onError?: (extensionId: string, error: Error) => void;
}
export interface RuntimeManager {
    startExtension(extensionPath: string, command: string): Promise<JSONNode>;
    stopExtension(extensionId: string): Promise<void>;
    render(extensionId: string): Promise<JSONNode>;
    getActiveExtension(): string | null;
}
export declare function createRuntimeManager(config?: RuntimeManagerConfig): RuntimeManager;
//# sourceMappingURL=manager.d.ts.map