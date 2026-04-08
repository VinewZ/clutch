interface RouteItemProps {
	path: string;
	label: string;
	index: number;
	isSelected: boolean;
	onClick: () => void;
}

export function RouteItem({
	label,
	index,
	isSelected,
	onClick,
}: RouteItemProps) {
	return (
		<button
			type="button"
			data-index={index}
			className={`flex items-center gap-4 p-4 w-full text-left transition-colors ${
				isSelected ? "bg-accent border-l-2 border-primary" : "hover:bg-accent"
			}`}
			onClick={onClick}
		>
			<div className="font-medium truncate">{label}</div>
		</button>
	);
}
