import {
	type JsonNodeData,
	renderJsonChildren,
	type TextJsonNodeData,
} from "@/components/JsonNode";
import type { RaycastComponentProps } from "./types";

export function ListSection({ node, onEvent }: RaycastComponentProps) {
	return (
		<div data-node-type={node.type}>
			{node.props.title ? (
				<div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
					{String(node.props.title)}
				</div>
			) : null}
			{renderJsonChildren(
				node.children as (JsonNodeData | TextJsonNodeData)[],
				onEvent,
			)}
		</div>
	);
}
