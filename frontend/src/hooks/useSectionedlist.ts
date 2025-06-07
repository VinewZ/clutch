import type { Quicklink } from "@/routes/settings/quicklinks";
import type {
  ClutchPkgJson,
  DesktopApp,
} from "bindings/github.com/vinewz/clutch/app";
import { useMemo } from "react";
import type { ListRoute } from "./useRoutes";
import { useDesktopData } from "./useDesktopData";

export type SectionedList = {
  apps: SectionApp[];
  extensions: SectionExtension[];
  routes: SectionRoute[];
  quicklinks: SectionQuicklink[];
  flatList: FlatList;
};

type SectionApp = DesktopApp & { _section: "Apps"; _uid: string };
type SectionExtension = ClutchPkgJson & { _section: "Extensions"; _uid: string };
type SectionRoute = ListRoute & { _section: "Routes"; _uid: string };
type SectionQuicklink = Quicklink & { _section: "Quicklinks"; _uid: string };
type FlatList = (
  | SectionApp
  | SectionExtension
  | SectionRoute
  | SectionQuicklink
)[]

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

  return useMemo(() => {
    const searchLower = search?.toLowerCase().trim();

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
      searchLower?.split(" ")[0] || "",
    );

    const flatList = [
      ...filteredApps,
      ...filteredExtensions,
      ...filteredRoutes,
      ...filteredQuickLinks,
    ]

    return {
      apps: filteredApps,
      extensions: filteredExtensions,
      routes: filteredRoutes,
      quicklinks: filteredQuickLinks,
      flatList: flatList,
    };
  }, [apps, extensions, routes, quicklinks, search]);
}

function filterAndSection<T, K extends string>(
  items: T[] | undefined,
  getLabel: (item: T) => string,
  sectionName: K,
  uidPrefix: string,
  searchLower?: string,
): (T & { _section: K; _uid: string })[] {
  if (!items || items.length === 0) return [];
  return items
    .filter((item) => {
      if (!searchLower) return true; // If search is empty, include all
      return getLabel(item).toLowerCase().includes(searchLower);
    })
    .map((item) => ({
      ...item,
      _section: sectionName,
      _uid: `${uidPrefix}-${getLabel(item)}`,
    }));
}
