import {
	type JsonNodeData,
	renderJsonChildren,
	type TextJsonNodeData,
} from "@/components/JsonNode";
import { renderIcon } from "./List";
import type { RaycastComponentProps } from "./types";

export function ListEmptyView({ node, onEvent }: RaycastComponentProps) {
	const icon = node.props.icon;
	const title = node.props.title as string | undefined;
	const description = node.props.description as string | undefined;
	const hasProps = icon || title || description;

	if (!hasProps) {
		return (
			<div className="p-8 text-center text-muted-foreground">
				{renderJsonChildren(
					node.children as (JsonNodeData | TextJsonNodeData)[],
					onEvent,
				)}
			</div>
		);
	}

	const iconNode = renderIcon(icon);

	return (
		<div className="flex flex-col items-center justify-center py-12 px-8 gap-3">
			{iconNode && (
				<span className="text-muted-foreground [&_svg]:size-10">
					{iconNode}
				</span>
			)}
			{title && (
				<div className="text-sm font-medium text-foreground text-center">
					{title}
				</div>
			)}
			{description && (
				<div className="text-xs text-muted-foreground text-center max-w-xs">
					{description}
				</div>
			)}
		</div>
	);
}
