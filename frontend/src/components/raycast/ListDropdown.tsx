import { Loader2 } from "lucide-react";
import { useCallback } from "react";
import type { RaycastComponentProps } from "./types";

interface DropdownChildNode {
	type: string;
	props: Record<string, unknown>;
	children: DropdownChildNode[];
	id: string;
}

export function ListDropdown({ node, onEvent }: RaycastComponentProps) {
	const value = node.props.value as string | undefined;
	const defaultValue = node.props.defaultValue as string | undefined;
	const tooltip = node.props.tooltip as string | undefined;
	const isLoading = node.props.isLoading as boolean | undefined;
	const placeholder = node.props.placeholder as string | undefined;
	const onChange = node.props.onChange as { $handler: string } | undefined;

	const currentValue = value ?? defaultValue ?? "";

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			if (onChange?.$handler) {
				onEvent?.(onChange.$handler, { value: e.target.value });
			}
		},
		[onChange, onEvent],
	);

	const renderOptions = (children: DropdownChildNode[]) => {
		const options: React.ReactNode[] = [];
		for (const child of children) {
			if (child.type === "List.Dropdown.Item") {
				const title =
					(child.props.title as string) ?? (child.props.value as string) ?? "";
				const itemValue = (child.props.value as string) ?? "";
				options.push(
					<option key={child.id} value={itemValue}>
						{title}
					</option>,
				);
			} else if (child.type === "List.Dropdown.Section") {
				const sectionTitle = child.props.title as string | undefined;
				options.push(
					<optgroup key={child.id} label={sectionTitle ?? ""}>
						{renderOptions(child.children)}
					</optgroup>,
				);
			}
		}
		return options;
	};

	return (
		<div
			data-node-type={node.type}
			data-node-id={node.id}
			className="relative flex items-center"
		>
			<select
				value={currentValue}
				onChange={handleChange}
				title={tooltip}
				className="h-7 rounded-md border border-input bg-transparent px-2 pr-7 text-xs outline-none cursor-pointer appearance-none hover:bg-accent focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
			>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{renderOptions(node.children as DropdownChildNode[])}
			</select>
			<div className="pointer-events-none absolute right-1.5 flex items-center gap-1">
				{isLoading && (
					<Loader2 className="size-3 animate-spin text-muted-foreground" />
				)}
				<svg
					className="size-3 text-muted-foreground"
					viewBox="0 0 12 12"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-hidden="true"
				>
					<path d="M3 4.5L6 7.5L9 4.5" />
				</svg>
			</div>
		</div>
	);
}

export function ListDropdownItem(_props: RaycastComponentProps) {
	return null;
}

export function ListDropdownSection(_props: RaycastComponentProps) {
	return null;
}
