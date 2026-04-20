import type { Action, SerializedEvent } from "../socket/protocol";
type EventHandler = (event: SerializedEvent) => Action | Promise<Action>;
declare class HandlerRegistry {
    private handlers;
    private counter;
    register(extensionId: string, handler: EventHandler): string;
    get(handlerId: string): EventHandler | undefined;
    execute(handlerId: string, event: SerializedEvent): Promise<Action>;
    has(handlerId: string): boolean;
    remove(handlerId: string): boolean;
    clearExtension(extensionId: string): void;
    clear(): void;
    getExtensionHandlers(extensionId: string): string[];
}
export declare const handlerRegistry: HandlerRegistry;
export declare function registerHandler(extensionId: string, handler: EventHandler): string;
export declare function executeHandler(handlerId: string, event: SerializedEvent): Promise<Action>;
export declare function clearExtensionHandlers(extensionId: string): void;
export declare function clearAllHandlers(): void;
export {};
//# sourceMappingURL=handler-registry.d.ts.map