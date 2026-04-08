import type { ListItem } from "@/types/list";
import { AppItem } from "./AppItem";
import { EmptyState } from "./EmptyState";
import { RouteItem } from "./RouteItem";
import { SectionHeader } from "./SectionHeader";

interface UnifiedListProps {
	list: ListItem[];
	selectedIndex: number;
	onAppClick: (
		app: import("bindings/github.com/vinewz/clutch/internal/apps").App,
	) => void;
	onRouteClick: (path: string) => void;
}

export function UnifiedList({
	list,
	selectedIndex,
	onAppClick,
	onRouteClick,
}: UnifiedListProps) {
	if (list.length === 0) {
		return <EmptyState />;
	}

	return (
		<div className="divide-y divide-border">
			{list.map((item) => {
				if (item.type === "section") {
					return (
						<SectionHeader
							key={`section-${item.section}`}
							section={item.section}
						/>
					);
				}
				if (item.type === "app") {
					return (
						<AppItem
							key={item.app.path}
							app={item.app}
							index={item.index}
							isSelected={item.index === selectedIndex}
							onClick={() => onAppClick(item.app)}
						/>
					);
				}
				if (item.type === "route") {
					return (
						<RouteItem
							key={item.path}
							path={item.path}
							label={item.label}
							index={item.index}
							isSelected={item.index === selectedIndex}
							onClick={() => onRouteClick(item.path)}
						/>
					);
				}
				return null;
			})}
		</div>
	);
}
