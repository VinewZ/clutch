export interface JSONNode {
	type: string;
	props: Record<string, unknown>;
	children: (JSONNode | string)[];
	id: string;
}

export interface Container {
	id: string;
	children: JSONNode[];
}

export interface JsonRendererOptions {
	onUpdate?: (json: JSONNode | null) => void;
}
