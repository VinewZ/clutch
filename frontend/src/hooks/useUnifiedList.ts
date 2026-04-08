import type { App } from "bindings/github.com/vinewz/clutch/internal/apps";
import { useMemo } from "react";
import { APP_ROUTES, type ListItem } from "@/types/list";

export function useUnifiedList(searchQuery: string, apps: App[]): ListItem[] {
	return useMemo(() => {
		const query = searchQuery.toLowerCase();
		const filteredAppsList = apps.filter(
			(app) =>
				app.name.toLowerCase().includes(query) ||
				app.keywords?.some((k) => k.toLowerCase().includes(query)),
		);
		const filteredRoutes = APP_ROUTES.filter((route) =>
			route.label.toLowerCase().includes(query),
		);

		const list: ListItem[] = [];
		let idx = 0;

		if (filteredAppsList.length > 0) {
			list.push({ index: idx++, type: "section", section: "apps" });
			for (const app of filteredAppsList) {
				list.push({ index: idx++, type: "app", app });
			}
		}

		if (filteredRoutes.length > 0) {
			list.push({ index: idx++, type: "section", section: "routes" });
			for (const route of filteredRoutes) {
				list.push({
					index: idx++,
					type: "route",
					path: route.path,
					label: route.label,
				});
			}
		}

		return list;
	}, [searchQuery, apps]);
}

export function getFirstSelectableIndex(list: ListItem[]): number {
	const firstItem = list.find((item) => item.type !== "section");
	return firstItem?.index ?? 0;
}
