import type { FormEvent } from "react";
import type { Quicklink } from "./settings/quicklinks";
import type {
	ClutchPkgJson,
	DesktopApp,
} from "../../bindings/github.com/vinewz/clutch/app";
import type { UseNavigateResult } from "@tanstack/react-router";
import { ClutchServices } from "../../bindings/github.com/vinewz/clutch/app";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGlobalSlashFocus } from "@/hooks/useGlobalSlashFocus";
import { Footer } from "./-components/footer";
import { HelpDialog } from "./-components/help_dialog";
import { Section } from "./-components/section";
import { Browser } from "@wailsio/runtime";
import { useSectionedList } from "@/hooks/useSectionedlist";
import { useRefsForKeys } from "@/hooks/useRefsForKeys";
import { useDesktopData } from "@/hooks/useDesktopData";
import type { ListRoute } from "@/hooks/useRoutes";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);
	const [search, setSearch] = useState("");
	const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
	const [focusedId, setFocusedId] = useState("");
	const [showLaunchKeys, setShowLaunchKeys] = useState(false);

	const { apps, extensions, routes, quicklinks } = useDesktopData();

	const sectioned = useSectionedList(
		search,
		apps,
		extensions,
		routes,
		quicklinks,
	);
	const flatOrder = useMemo(
		() =>
			[
				sectioned.apps,
				sectioned.extensions,
				sectioned.routes,
				sectioned.quicklinks,
			].flatMap((list) => list.map((it: { _uid: string }) => it._uid)),
		[sectioned],
	);
	const refs = useRefsForKeys<HTMLLIElement>(flatOrder);
	useKeyboardNav({
		flatOrder,
		focusedId,
		setFocusedId,
		refs,
		handleSubmit,
		toggleHelp: () => setIsHelpDialogOpen((prev) => !prev),
		setShowLaunchKeys,
	});

	useGlobalSlashFocus(inputRef);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	function handleSubmit() {
		const focusedItem =
			sectioned.apps.find((a) => a._uid === focusedId) ||
			sectioned.extensions.find((e) => e._uid === focusedId) ||
			sectioned.routes.find((r) => r._uid === focusedId) ||
			sectioned.quicklinks.find((r) => r._uid === focusedId);
		if (focusedItem) {
			switch (focusedItem._section) {
				case "Apps": {
					handleApp(focusedItem);
					break;
				}
				case "Extensions": {
					handleExtensions(focusedItem, navigate);
					break;
				}
				case "Routes": {
					handleRoutes(focusedItem, navigate);
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
	}

	return (
		<main>
			<HelpDialog isOpen={isHelpDialogOpen} setIsOpen={setIsHelpDialogOpen} />
			<Input
				ref={inputRef}
				className="h-[50px] rounded-none border-0 border-b"
				value={search}
				placeholder={`Type "/" to search...`}
				onChange={(e) => {
					setSearch(e.target.value);
					setFocusedId(flatOrder[0] || "");
				}}
				onBeforeInput={(e: FormEvent<HTMLInputElement>) => {
					const native = e.nativeEvent as InputEvent;
					if (native.data === "/") {
						native.preventDefault();
					}
				}}
			/>
			<ScrollArea className="h-[515px] pb-1.5">
				<ul className="flex h-full w-full flex-col overflow-hidden">
					{Object.entries(sectioned).map(([key, list]) => {
						if (search.startsWith(":") && key !== "quicklinks") return;
						return (
							<Section
								key={key}
								sectionKey={key}
								//@ts-ignore
								list={list}
								focusedId={focusedId}
								refs={refs}
								handleSubmit={handleSubmit}
								setFocusedId={setFocusedId}
								showLaunchKeys={showLaunchKeys}
							/>
						);
					})}
				</ul>
			</ScrollArea>
			<Footer />
		</main>
	);
}

function handleApp(app: DesktopApp) {
	ClutchServices.ExecApp(app);
	ClutchServices.ToggleApp();
}

function handleExtensions(
	extension: ClutchPkgJson,
	navigate: UseNavigateResult<string>,
) {
	navigate({
		to: "/extension/$extension",
		params: { extension: extension.clutch.repo },
	});
}

function handleRoutes(routes: ListRoute, navigate: UseNavigateResult<string>) {
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
