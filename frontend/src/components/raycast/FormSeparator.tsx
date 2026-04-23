import type { RaycastComponentProps } from "./registry";

export function FormSeparator({ node }: RaycastComponentProps) {
	return (
		<div
			data-node-type={node.type}
			data-node-id={node.id}
			className="border-t border-border my-2"
		/>
	);
}
