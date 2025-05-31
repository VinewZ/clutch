import type { Quicklink } from "@/routes/settings/quicklinks";
import type {
	ClutchPkgJson,
	DesktopApp,
} from "bindings/github.com/vinewz/clutch/app";
import { useMemo } from "react";

export type ListRoute = {
	path: string;
	label: string;
};

function filterAndSection<T, K extends string>(
	items: T[] | undefined,
	getLabel: (item: T) => string,
	sectionName: K,
	uidPrefix: string,
	searchLower: string,
): (T & { _section: K; _uid: string })[] {
	if (!items || items.length === 0) return [];
	return items
		.filter((item) => {
			return getLabel(item).toLowerCase().includes(searchLower);
		})
		.map((item) => ({
			...item,
			_section: sectionName,
			_uid: `${uidPrefix}-${getLabel(item)}`,
		}));
}

export function useSectionedList(
	search: string,
	apps?: DesktopApp[],
	extensions?: ClutchPkgJson[],
	routes?: ListRoute[],
	quicklinks?: Quicklink[],
) {
	return useMemo(() => {
		const searchLower = search.toLowerCase().trim();

		const filteredApps = filterAndSection(
			apps,
			(a) => a.name,
			"Apps",
			"apps",
			searchLower,
		);

		const filteredExtensions = filterAndSection(
			extensions,
			(e) => e.clutch.name,
			"Extensions",
			"ext",
			searchLower,
		);

		const filteredRoutes = filterAndSection(
			routes,
			(r) => r.label,
			"Routes",
			"route",
			searchLower,
		);

		const filteredQuickLinks = filterAndSection(
			quicklinks,
			(q) => q.command,
			"Quicklinks",
			"quicklink",
			searchLower.split(" ")[0],
		);

		return {
			apps: filteredApps,
			extensions: filteredExtensions,
			routes: filteredRoutes,
			quicklinks: filteredQuickLinks,
		};
	}, [search, apps, extensions, routes, quicklinks]);
}
