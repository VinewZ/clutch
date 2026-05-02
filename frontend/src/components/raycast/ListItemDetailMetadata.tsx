import {
	type JsonNodeData,
	renderJsonNode,
	type TextJsonNodeData,
} from "@/components/JsonNode";
import type { RaycastComponentProps } from "./types";

export function ListItemDetailMetadata({
	node,
	onEvent,
}: RaycastComponentProps) {
	return (
		<div data-node-type={node.type} className="space-y-2">
			{(node.children as (JsonNodeData | TextJsonNodeData)[]).map((child) =>
				renderJsonNode(child, onEvent),
			)}
		</div>
	);
}
