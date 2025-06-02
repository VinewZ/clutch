import type { Quicklink } from "@/routes/settings/quicklinks";
import { useDesktopApps } from "@/hooks/useDesktopApps";
import { useDesktopExtensions } from "@/hooks/useExtensions";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useRoutes } from "./useRoutes";

export function useDesktopData() {
	const { data: apps } = useDesktopApps();
	const { data: extensions } = useDesktopExtensions();
	const [quicklinks] = useLocalStorage<Quicklink[]>("quickLinks", []);
	const routes = useRoutes();

	return { apps, extensions, routes, quicklinks };
}
