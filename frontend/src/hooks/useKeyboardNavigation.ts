import type { App } from "bindings/github.com/vinewz/clutch/internal/apps";
import { useCallback, useEffect, useRef } from "react";
import type { ConversionResult } from "@/lib/currency";
import type { MathResult } from "@/lib/math";
import type { ListItem } from "@/types/list";
import { getFirstSelectableIndex } from "./useUnifiedList";

interface UseKeyboardNavigationProps {
	mode: "apps" | "math" | "currency";
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
	setSearchQuery: (value: string) => void;
	unifiedList: ListItem[];
	mathResult: MathResult | null;
	currencyResult: ConversionResult | null;
	copy: (text: string) => Promise<boolean>;
	launchApp: (app: App) => Promise<void>;
	navigate: (opts: { to: string }) => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
}

export function useKeyboardNavigation({
	mode,
	selectedIndex,
	setSelectedIndex,
	setSearchQuery,
	unifiedList,
	mathResult,
	currencyResult,
	copy,
	launchApp,
	navigate,
	inputRef,
}: UseKeyboardNavigationProps) {
	const stateRef = useRef({
		mode,
		selectedIndex,
		unifiedList,
		mathResult,
		currencyResult,
	});

	useEffect(() => {
		stateRef.current = {
			mode,
			selectedIndex,
			unifiedList,
			mathResult,
			currencyResult,
		};
	}, [mode, selectedIndex, unifiedList, mathResult, currencyResult]);

	const handleKeyDown = useCallback(
		async (e: KeyboardEvent) => {
			const current = stateRef.current;

			switch (e.key) {
				case "Escape": {
					setSearchQuery("");
					setSelectedIndex(getFirstSelectableIndex(current.unifiedList));
					inputRef.current?.focus();
					break;
				}
				case "ArrowDown": {
					e.preventDefault();
					if (current.mode !== "apps") return;

					const nonSectionItems = current.unifiedList.filter(
						(item) => item.type !== "section",
					);
					if (nonSectionItems.length === 0) return;

					const currentItem = current.unifiedList[current.selectedIndex];
					const currentItemIndex = nonSectionItems.findIndex(
						(item) => item.index === currentItem?.index,
					);
					const nextIndex = (currentItemIndex + 1) % nonSectionItems.length;
					const nextItem = nonSectionItems[nextIndex];
					const newSelectedIndex = current.unifiedList.findIndex(
						(item) => item.index === nextItem.index,
					);
					setSelectedIndex(newSelectedIndex);
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					if (current.mode !== "apps") return;

					const nonSectionItems = current.unifiedList.filter(
						(item) => item.type !== "section",
					);
					if (nonSectionItems.length === 0) return;

					const currentItem = current.unifiedList[current.selectedIndex];
					const currentItemIndex = nonSectionItems.findIndex(
						(item) => item.index === currentItem?.index,
					);
					const prevIndex =
						(currentItemIndex - 1 + nonSectionItems.length) %
						nonSectionItems.length;
					const prevItem = nonSectionItems[prevIndex];
					const newSelectedIndex = current.unifiedList.findIndex(
						(item) => item.index === prevItem.index,
					);
					setSelectedIndex(newSelectedIndex);
					break;
				}
				case "Enter": {
					e.preventDefault();
					if (current.mode === "math" && current.mathResult) {
						await copy(current.mathResult.result.toString());
						break;
					}
					if (current.mode === "currency" && current.currencyResult) {
						await copy(current.currencyResult.result.toString());
						break;
					}
					if (current.mode === "apps") {
						const currentItem = current.unifiedList[current.selectedIndex];
						if (!currentItem || currentItem.type === "section") return;
						if (currentItem.type === "app") {
							await launchApp(currentItem.app);
							setSearchQuery("");
						} else if (currentItem.type === "route") {
							navigate({ to: currentItem.path });
						}
					}
					break;
				}
			}
		},
		[setSelectedIndex, setSearchQuery, copy, launchApp, navigate, inputRef],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	return { selectedIndex };
}
