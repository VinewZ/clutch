import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useFormContext } from "./Form";
import type { RaycastComponentProps } from "./types";

export function FormTextField({ node, onEvent }: RaycastComponentProps) {
	const title = node.props.title as string | undefined;
	const placeholder = node.props.placeholder as string | undefined;
	const value = node.props.value as string | undefined;
	const id = node.props.id as string | undefined;
	const onChange = node.props.onChange as { $handler: string } | undefined;
	const formCtx = useFormContext();

	const currentValue =
		id && formCtx
			? ((formCtx.values[id] as string | undefined) ?? value ?? "")
			: (value ?? "");

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
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
			<input
				id={fieldId}
				type="text"
				value={currentValue}
				onChange={handleChange}
				placeholder={placeholder}
				className={cn(
					"h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none",
					"placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
					"dark:bg-input/30",
				)}
			/>
		</div>
	);
}
