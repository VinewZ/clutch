export interface JSONNode {
	type: string;
	props: Record<string, unknown>;
	children: (JSONNode | string)[];
	id: string;
}

export interface JsonRendererContainer {
	root: JSONNode | null;
	listeners: Set<(json: JSONNode | null) => void>;
	version: number;
}

export interface JsonRendererOptions {
	onUpdate?: (json: JSONNode | null) => void;
}

export interface JsonRendererRoot {
	render: (element: React.ReactNode) => void;
	unmount: () => void;
	getSnapshot: () => JSONNode | null;
	subscribe: (listener: (json: JSONNode | null) => void) => () => void;
}
