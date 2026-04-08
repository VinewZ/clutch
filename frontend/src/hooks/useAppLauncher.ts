import type { App } from "bindings/github.com/vinewz/clutch/internal/apps";
import {
	AppController,
	DesktopApps,
} from "bindings/github.com/vinewz/clutch/internal/apps";

export function useAppLauncher() {
	const launchApp = async (app: App): Promise<void> => {
		await DesktopApps.Launch(app);
		await AppController.Hide();
	};

	return { launchApp };
}
