import { useHotkeys } from "@tanstack/react-hotkeys";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { type RefObject, useEffect, useState } from "react";

export interface UseListNavigationOptions {
	totalItems: number;
	isInputEmpty: boolean;
	inputRef: RefObject<HTMLInputElement | null>;
	focusInput?: () => void;
	onSelect?: (index: number) => void;
	onEscape?: () => void;
}

export function useListNavigation({
	totalItems,
	isInputEmpty,
	inputRef,
	focusInput,
	onSelect,
	onEscape,
}: UseListNavigationOptions) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const location = useLocation();
	const navigate = useNavigate();

	useHotkeys([
		{
			hotkey: "ArrowDown",
			callback: () => {
				setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
			},
		},
		{
			hotkey: "ArrowUp",
			callback: () => {
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
			},
		},
		{
			hotkey: "/",
			callback: () => {
				focusInput?.();
			},
		},
		{
			hotkey: "Enter",
			callback: () => {
				if (selectedIndex >= 0 && selectedIndex < totalItems) {
					onSelect?.(selectedIndex);
				}
			},
		},
		{
			hotkey: "Escape",
			callback: () => {
				onEscape?.();
			},
		},
		{
			hotkey: "Backspace",
			callback: (e) => {
				if (isInputEmpty && document.activeElement === inputRef.current) {
					e.preventDefault();
					if (location.href !== "/") {
						navigate({ to: "/" });
					}
				}
			},
			options: {
				target: inputRef,
				preventDefault: false,
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
