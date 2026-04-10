import type { App } from "bindings/github.com/vinewz/clutch/internal/apps";
import { cn } from "#/lib/utils";

interface AppItemProps {
	app: App;
	index: number;
	isSelected: boolean;
	onClick: () => void;
}

export function AppItem({ app, index, isSelected, onClick }: AppItemProps) {
	return (
		<button
			type="button"
			data-index={index}
			className={cn(
				"flex items-center gap-4 p-4 w-full text-left transition-colors",
				isSelected ? "bg-accent border-l-2 border-primary" : "hover:bg-accent",
			)}
			onClick={onClick}
		>
			<img
				className="rounded-md object-contain size-7"
				src={`/files/icon?path=${encodeURIComponent(app.iconPath)}`}
				alt={app.name}
				onError={(e) => {
					e.currentTarget.style.display = "none";
				}}
			/>
			<div className="font-medium truncate">{app.name}</div>
		</button>
	);
}
