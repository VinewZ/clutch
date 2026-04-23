export interface JSONNode {
	type: string;
	props: Record<string, unknown>;
	children: (JSONNode | TextJSONNode)[];
	id: string;
}

export interface TextJSONNode {
	type: "TEXT";
	props: { text: string };
	children: never[];
	id: string;
}

export interface Container {
	id: string;
	children: JSONNode[];
}

export interface JsonRendererOptions {
	onUpdate?: (json: JSONNode | null) => void;
	extensionId?: string;
}
