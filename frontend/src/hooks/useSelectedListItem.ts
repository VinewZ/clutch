import type { Dispatch, SetStateAction } from "react";
import type { SectionedListItem } from "./useSectionedlist";
import type { ListRoute } from "./useRoutes";
import type { Quicklink } from "@/routes/settings/quicklinks";
import type { DesktopApp } from "../../bindings/github.com/vinewz/clutch/app";
import { useNavigate } from "@tanstack/react-router";
import {
	type ClutchPkgJson,
	ClutchServices,
} from "../../bindings/github.com/vinewz/clutch/app";
import { Browser } from "@wailsio/runtime";

type UseSelectedListItemProps = {
	focusedItem: SectionedListItem;
	search: string;
	setSearch: Dispatch<SetStateAction<string>>;
};

export function useSelectedListItem() {
	const navigate = useNavigate();

	function handleApp(app: DesktopApp) {
		ClutchServices.ExecApp(app);
		ClutchServices.ToggleApp();
	}

	function handleExtensions(extension: ClutchPkgJson) {
		navigate({
			to: "/extension/$extension",
			params: { extension: extension.clutch.repo },
		});
	}

	function handleRoutes(routes: ListRoute) {
		navigate({
			to: routes.path,
		});
	}

	function handleQuicklink(qLink: Quicklink, param: string) {
		try {
			Browser.OpenURL(`${qLink.link}${param}`);
		} catch (err) {
			console.log(err);
		}
		ClutchServices.ToggleApp();
	}

	return function handler({
		search,
		setSearch,
		focusedItem,
	}: UseSelectedListItemProps) {
		if (focusedItem) {
			switch (focusedItem._section) {
				case "Apps": {
					handleApp(focusedItem);
					break;
				}
				case "Extensions": {
					handleExtensions(focusedItem);
					break;
				}
				case "Routes": {
					handleRoutes(focusedItem);
					break;
				}
				case "Quicklinks": {
					const split = search.split(" ");
					const param = split.slice(1).join(" ");
					handleQuicklink(focusedItem, param);
					break;
				}
			}
			setSearch("");
		}
	};
}
