import { List } from "./components/list";
import { Grid } from "./components/grid";
import { Form } from "./components/form";
import { Detail } from "./components/detail";
import { Action, ActionPanel } from "./components/action";
import { NavigationProvider, useNavigation } from "./hooks";
import {
	getPreferenceValues,
	initializePreferences,
	resetPreferences,
} from "./preferences";
import { Cache } from "./cache";

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
	},
};
