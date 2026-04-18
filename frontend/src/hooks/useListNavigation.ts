import { useHotkeys } from "@tanstack/react-hotkeys";
import { useEffect, useState } from "react";

export interface UseListNavigationOptions {
	totalItems: number;
	onSelect?: (index: number) => void;
	onEscape?: () => void;
}

export function useListNavigation({
	totalItems,
	onSelect,
	onEscape,
}: UseListNavigationOptions) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	useHotkeys([
		{
			hotkey: "ArrowDown",
			callback: (e) => {
				e.preventDefault();
				setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
			},
		},
		{
			hotkey: "ArrowUp",
			callback: (e) => {
				e.preventDefault();
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
			},
		},
		{
			hotkey: "Enter",
			callback: (e) => {
				e.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < totalItems) {
					onSelect?.(selectedIndex);
				}
			},
		},
		{
			hotkey: "Escape",
			callback: (e) => {
				e.preventDefault();
				onEscape?.();
			},
		},
	]);

	useEffect(() => {
		if (totalItems > 0 && selectedIndex >= totalItems) {
			setSelectedIndex(totalItems - 1);
		}
	}, [totalItems, selectedIndex]);

	return { selectedIndex, setSelectedIndex };
}
