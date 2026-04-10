import { useHotkeys } from "@tanstack/react-hotkeys";
import {
	type App,
	AppController,
} from "bindings/github.com/vinewz/clutch/internal/apps";
import { getFirstSelectableIndex } from "@/hooks/useUnifiedList";
import type { ConversionResult } from "@/lib/currency";
import type { MathResult } from "@/lib/math";
import type { ListItem } from "@/types/list";

interface UseHomeKeyboardProps {
	inputRef: React.RefObject<HTMLInputElement | null>;
	mode: "apps" | "math" | "currency";
	searchQuery: string;
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
	setSearchQuery: (value: string) => void;
	unifiedList: ListItem[];
	mathResult: MathResult | null;
	currencyResult: ConversionResult | null;
	copy: (text: string) => Promise<boolean>;
	launchApp: (app: App) => Promise<void>;
	navigate: (opts: { to: string }) => void;
}

export function useHomeKeyboard({
	inputRef,
	mode,
	searchQuery,
	selectedIndex,
	setSelectedIndex,
	setSearchQuery,
	unifiedList,
	mathResult,
	currencyResult,
	copy,
	launchApp,
	navigate,
}: UseHomeKeyboardProps) {
	useHotkeys([
		{
			hotkey: "/",
			callback: (e) => {
				console.log(e);
				inputRef.current?.focus();
			},
		},
		{
			hotkey: "Escape",
			callback: async () => {
				if (searchQuery === "") {
					await AppController.Hide();
					return;
				}
				setSearchQuery("");
				setSelectedIndex(getFirstSelectableIndex(unifiedList));
				inputRef.current?.focus();
			},
		},
		{
			hotkey: "ArrowDown",
			callback: (e) => {
				e.preventDefault();
				if (mode !== "apps") return;

				const nonSectionItems = unifiedList.filter(
					(item) => item.type !== "section",
				);
				if (nonSectionItems.length === 0) return;

				const currentItem = unifiedList[selectedIndex];
				const currentItemIndex = nonSectionItems.findIndex(
					(item) => item.index === currentItem?.index,
				);
				const nextIndex = (currentItemIndex + 1) % nonSectionItems.length;
				const nextItem = nonSectionItems[nextIndex];
				const newSelectedIndex = unifiedList.findIndex(
					(item) => item.index === nextItem.index,
				);
				setSelectedIndex(newSelectedIndex);
			},
		},
		{
			hotkey: "ArrowUp",
			callback: (e) => {
				e.preventDefault();
				if (mode !== "apps") return;

				const nonSectionItems = unifiedList.filter(
					(item) => item.type !== "section",
				);
				if (nonSectionItems.length === 0) return;

				const currentItem = unifiedList[selectedIndex];
				const currentItemIndex = nonSectionItems.findIndex(
					(item) => item.index === currentItem?.index,
				);
				const prevIndex =
					(currentItemIndex - 1 + nonSectionItems.length) %
					nonSectionItems.length;
				const prevItem = nonSectionItems[prevIndex];
				const newSelectedIndex = unifiedList.findIndex(
					(item) => item.index === prevItem.index,
				);
				setSelectedIndex(newSelectedIndex);
			},
		},
		{
			hotkey: "Enter",
			callback: async (e) => {
				e.preventDefault();
				if (mode === "math" && mathResult) {
					await copy(mathResult.result.toString());
					return;
				}
				if (mode === "currency" && currencyResult) {
					await copy(currencyResult.result.toString());
					return;
				}
				if (mode === "apps") {
					const currentItem = unifiedList[selectedIndex];
					if (!currentItem || currentItem.type === "section") return;
					if (currentItem.type === "app") {
						await launchApp(currentItem.app);
						setSearchQuery("");
					} else if (currentItem.type === "route") {
						navigate({ to: currentItem.path });
					}
				}
			},
		},
	]);
}
