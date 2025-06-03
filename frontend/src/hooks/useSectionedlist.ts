import type { Quicklink } from "@/routes/settings/quicklinks";
import type {
  ClutchPkgJson,
  DesktopApp,
} from "bindings/github.com/vinewz/clutch/app";
import { useMemo } from "react";
import type { ListRoute } from "./useRoutes";
import { useDesktopData } from "./useDesktopData";

export type SectionedList = {
  apps: (DesktopApp & { _section: "Apps"; _uid: string })[];
  extensions: (ClutchPkgJson & { _section: "Extensions"; _uid: string })[];
  routes: (ListRoute & { _section: "Routes"; _uid: string })[];
  quicklinks: (Quicklink & { _section: "Quicklinks"; _uid: string })[];
  flatUids: string[];
};

export type SectionedListItem =
  | SectionedList["apps"][0]
  | SectionedList["extensions"][0]
  | SectionedList["routes"][0]
  | SectionedList["quicklinks"][0];

type UseSectionedListProps = {
  search?: string;
}

export function useSectionedList({ search }: UseSectionedListProps) {
  const { apps, extensions, routes, quicklinks } = useDesktopData();
  console.log("useSectionedList Data:", {
    apps,
    extensions,
    routes,
    quicklinks,
  });


  return useMemo(() => {
    const searchLower = search?.toLowerCase().trim();

    const filteredApps = searchLower && filterAndSection(
      apps,
      (a) => a.name,
      "Apps",
      "apps",
      searchLower,
    );

    const filteredExtensions = searchLower && filterAndSection(
      extensions,
      (e) => e.clutch.name,
      "Extensions",
      "ext",
      searchLower,
    );

    const filteredRoutes = searchLower && filterAndSection(
      routes,
      (r) => r.label,
      "Routes",
      "route",
      searchLower,
    );

    const filteredQuickLinks = searchLower && filterAndSection(
      quicklinks,
      (q) => q.command,
      "Quicklinks",
      "quicklink",
      searchLower.split(" ")[0],
    );

    const flatOrder = [
      ...filteredApps || [],
      ...filteredExtensions || [],
      ...filteredRoutes || [],
      ...filteredQuickLinks || [],
    ].map((item) => item._uid);

    console.log("Sectioned List:", {
      apps: filteredApps,
      extensions: filteredExtensions,
      routes: filteredRoutes,
      quicklinks: filteredQuickLinks,
      flatUids: flatOrder,
    });

    return {
      apps: filteredApps,
      extensions: filteredExtensions,
      routes: filteredRoutes,
      quicklinks: filteredQuickLinks,
      flatUids: flatOrder,
    };
  }, [apps, extensions, routes, quicklinks]);
}

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

