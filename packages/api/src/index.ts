import { Cache } from "./cache";
import { Action, ActionPanel } from "./components/action";
import { Detail } from "./components/detail";
import { Form } from "./components/form";
import { Grid } from "./components/grid";
import { List } from "./components/list";
import type {
	ToastOptions,
	ToastStyle as ToastStyleType,
} from "./feedback/toast";
import {
	showToast,
	Toast,
	ToastProvider,
	Style as ToastStyle,
} from "./feedback/toast";
import { NavigationProvider, useNavigation } from "./hooks";
import {
	getPreferenceValues,
	initializePreferences,
	resetPreferences,
} from "./preferences";

export { showToast, ToastProvider, Toast, ToastStyle };
export type { ToastOptions, ToastStyleType };

export const clutch = {
	api: {
		List,
		Grid,
		Form,
		Detail,
		Action,
		ActionPanel,
		NavigationProvider,
		useNavigation,
		getPreferenceValues,
		initializePreferences,
		resetPreferences,
		Cache,
		showToast,
		ToastProvider,
		Toast: { ...Toast, Style: ToastStyle },
	},
};
