import type { JSONNode } from "./reconciler/types";

export type Container = {
	id: string;
	children: JSONNode[];
};

export const instances = new Map<number, JSONNode>();
export const root: Container = { id: "root", children: [] };

let instanceCounter = 0;
export const getNextInstanceId = (): number => ++instanceCounter;

export function resetState(): void {
	instances.clear();
	root.children = [];
	instanceCounter = 0;
}
