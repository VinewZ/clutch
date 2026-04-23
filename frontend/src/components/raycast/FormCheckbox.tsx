import { useCallback } from "react";
import { useFormContext } from "./Form";
import type { RaycastComponentProps } from "./registry";

export function FormCheckbox({ node, onEvent }: RaycastComponentProps) {
	const title = node.props.title as string | undefined;
	const label = node.props.label as string | undefined;
	const id = node.props.id as string | undefined;
	const value = node.props.value as boolean | undefined;
	const onChange = node.props.onChange as { $handler: string } | undefined;
	const formCtx = useFormContext();

	const currentValue =
		id && formCtx
			? ((formCtx.values[id] as boolean | undefined) ?? value ?? false)
			: (value ?? false);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (id && formCtx) formCtx.setValue(id, e.target.checked);
			if (onChange?.$handler)
				onEvent?.(onChange.$handler, { value: e.target.checked });
		},
		[id, formCtx, onChange, onEvent],
	);

	return (
		<div
			data-node-type={node.type}
			data-node-id={node.id}
			className="flex items-center gap-2"
		>
			<input
				type="checkbox"
				checked={currentValue}
				onChange={handleChange}
				className="size-4 rounded border border-input"
			/>
			<span className="text-sm">{title ?? label}</span>
		</div>
	);
}
