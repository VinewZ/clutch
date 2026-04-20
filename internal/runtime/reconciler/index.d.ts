import type { ReactNode } from "react";
import type { JSONNode, JsonRendererOptions } from "./types";
import { resetState } from "../state";
export interface JsonRendererAPI {
    render(component: ReactNode): JSONNode | null;
    unmount(): void;
}
export declare function createReconciler(_options?: JsonRendererOptions): JsonRendererAPI;
export declare function render(element: ReactNode, options?: JsonRendererOptions): JSONNode | null;
export { resetState };
export type { JSONNode, Container, JsonRendererOptions } from "./types";
//# sourceMappingURL=index.d.ts.map