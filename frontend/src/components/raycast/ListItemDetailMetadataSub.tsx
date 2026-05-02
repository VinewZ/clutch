import type { RaycastComponentProps } from "./types";

export function MetadataLabel({ node }: RaycastComponentProps) {
	const title = node.props.title as string | undefined;
	const text = node.props.text as string | undefined;
	return (
		<div data-node-type={node.type} className="flex items-center gap-2 text-sm">
			<span className="text-muted-foreground min-w-[100px]">{title ?? ""}</span>
			<span className="text-foreground">{text ?? ""}</span>
		</div>
	);
}

export function MetadataLink({ node, onEvent }: RaycastComponentProps) {
	const title = node.props.title as string | undefined;
	const text = node.props.text as string | undefined;
	const target = node.props.target as string | undefined;
	const onAction = node.props.onAction as { $handler: string } | undefined;

	return (
		<div data-node-type={node.type} className="flex items-center gap-2 text-sm">
			<span className="text-muted-foreground min-w-[100px]">{title ?? ""}</span>
			<button
				type="button"
				className="text-primary hover:underline"
				onClick={() => {
					if (onAction?.$handler) onEvent?.(onAction.$handler, {});
				}}
			>
				{text ?? target ?? ""}
			</button>
		</div>
	);
}

export function MetadataTagList({ node }: RaycastComponentProps) {
	const title = node.props.title as string | undefined;

	return (
		<div data-node-type={node.type} className="flex items-start gap-2 text-sm">
			<span className="text-muted-foreground min-w-[100px] pt-0.5">
				{title ?? ""}
			</span>
			<div className="flex flex-wrap gap-1">
				{(
					node.children as Array<{
						type: string;
						props: Record<string, unknown>;
						id: string;
					}>
				).map((child) => {
					if (child.type === "List.Item.Detail.Metadata.TagList.Item") {
						const text = child.props.text as string | undefined;
						const color = child.props.color as string | undefined;
						return (
							<span
								key={child.id}
								className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-muted"
								style={color ? { color } : undefined}
							>
								{text ?? ""}
							</span>
						);
					}
					return null;
				})}
			</div>
		</div>
	);
}

export function MetadataSeparator({ node }: RaycastComponentProps) {
	return (
		<div data-node-type={node.type} className="border-t border-border my-2" />
	);
}
