import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useFormContext } from "./Form";
import type { RaycastComponentProps } from "./registry";

interface DropdownChildNode {
	type: string;
	props: Record<string, unknown>;
	children: unknown[];
	id: string;
}

export function FormDropdown({ node, onEvent }: RaycastComponentProps) {
	const title = node.props.title as string | undefined;
	const id = node.props.id as string | undefined;
	const onChange = node.props.onChange as { $handler: string } | undefined;
	const formCtx = useFormContext();

	const options: { value: string; title: string }[] = [];
	for (const child of node.children as DropdownChildNode[]) {
		if (child.type === "Form.Dropdown.Item") {
			options.push({
				value: (child.props.value as string) ?? "",
				title:
					(child.props.title as string) ?? (child.props.value as string) ?? "",
			});
		}
	}

	const currentValue =
		id && formCtx
			? ((formCtx.values[id] as string | undefined) ??
				(node.props.value as string | undefined) ??
				"")
			: ((node.props.value as string | undefined) ?? "");

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			if (id && formCtx) formCtx.setValue(id, e.target.value);
			if (onChange?.$handler)
				onEvent?.(onChange.$handler, { value: e.target.value });
		},
		[id, formCtx, onChange, onEvent],
	);

	const fieldId = id ?? node.id;

	return (
		<div
			data-node-type={node.type}
			data-node-id={node.id}
			className="space-y-1"
		>
			{title && (
				<label htmlFor={fieldId} className="text-sm font-medium">
					{title}
				</label>
			)}
			<select
				id={fieldId}
				value={currentValue}
				onChange={handleChange}
				className={cn(
					"h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none",
					"focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
					"dark:bg-input/30",
				)}
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.title}
					</option>
				))}
			</select>
		</div>
	);
}
