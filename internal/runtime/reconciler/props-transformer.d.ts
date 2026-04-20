import type { Action, SerializedEvent } from "../socket/protocol";
interface HandlerReference {
    $handler: string;
}
export interface TransformOptions {
    extensionId: string;
    handlers?: Map<string, (event: SerializedEvent) => Action | Promise<Action>>;
}
export declare function transformProps(props: Record<string, unknown>, options: TransformOptions): Record<string, unknown>;
export declare function isTransformed(value: unknown): value is HandlerReference;
export declare function getHandlerId(handlerRef: HandlerReference): string;
export {};
//# sourceMappingURL=props-transformer.d.ts.map