import { Cache } from "./cache";
import { getSelectedText } from "./clipboard";
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
import { Color } from "./utils/color";
import { Icon } from "./utils/icon";
import { Keyboard } from "./utils/keyboard";
import { LaunchType } from "./utils/launch-type";

export {
	showToast,
	ToastProvider,
	Toast,
	ToastStyle,
	Color,
	Icon,
	Keyboard,
	LaunchType,
};
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
		getSelectedText,
		showToast,
		ToastProvider,
		Toast: Object.assign(Toast, { Style: ToastStyle }),
		Color,
		Icon,
		Keyboard,
		LaunchType,
	},
};
