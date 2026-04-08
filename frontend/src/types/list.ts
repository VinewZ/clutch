import type { App } from "bindings/github.com/vinewz/clutch/internal/apps";

export type ListItemType = "section" | "app" | "route";

export type ListItem =
	| { index: number; type: "section"; section: "apps" | "routes" }
	| { index: number; type: "app"; app: App }
	| { index: number; type: "route"; path: string; label: string };

export interface RouteConfig {
	path: string;
	label: string;
}

export const APP_ROUTES: RouteConfig[] = [
	{ path: "/clipboard", label: "Clipboard" },
];
