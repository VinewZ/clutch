import {
	type JsonNodeData,
	renderJsonChildren,
	type TextJsonNodeData,
} from "@/components/JsonNode";
import type { RaycastComponentProps } from "./types";

export function Slot({ node, onEvent }: RaycastComponentProps) {
	const name = node.props.name as string | undefined;
	return (
		<div data-slot={name ?? "unknown"}>
			{renderJsonChildren(
				node.children as (JsonNodeData | TextJsonNodeData)[],
				onEvent,
			)}
		</div>
	);
}
