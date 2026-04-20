import type { JSONNode } from "./reconciler/types";
export type Container = {
    id: string;
    children: JSONNode[];
};
export declare const instances: Map<number, JSONNode>;
export declare const root: Container;
export declare const getNextInstanceId: () => number;
export declare function resetState(): void;
//# sourceMappingURL=state.d.ts.map