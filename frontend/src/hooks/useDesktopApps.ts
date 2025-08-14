import { useQuery } from "@tanstack/react-query";
import {
	ClutchServices,
	DesktopApp,
} from "../../bindings/github.com/vinewz/clutch/app/";

async function getDesktopApps(): Promise<DesktopApp[]> {
	try {
		const appsMap = await ClutchServices.GetDesktopApps();
		return Object.values(appsMap).map((app) =>
			app instanceof DesktopApp ? app : DesktopApp.createFrom(app),
		);
	} catch (error) {
		console.error(error);
		return [];
	}
}

export function useDesktopApps() {
	return useQuery<DesktopApp[]>({
		queryKey: ["clutch-desktop-apps"],
		queryFn: getDesktopApps,
	});
}
