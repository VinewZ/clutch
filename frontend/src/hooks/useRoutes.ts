export type ListRoute = {
	path: string;
	label: string;
};

export function useRoutes(): ListRoute[] {
	const routes: ListRoute[] = [
		{ path: "/settings/general", label: "Settings" },
	];

	return routes;
}
