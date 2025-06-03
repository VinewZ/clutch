import { useEffect, useCallback } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { ClutchServices } from "../../bindings/github.com/vinewz/clutch/app";

export interface KeyboardNavOptions {
	flatUids: string[];
	focusedId: string;
	setFocusedId: (id: string) => void;
	refs: Record<string, RefObject<HTMLElement | null>>;
	handleSubmit: () => void;
	toggleHelp: () => void;
	setShowLaunchKeys: Dispatch<SetStateAction<boolean>>;
}

export function useKeyboardNav({
	flatUids,
	focusedId,
	setFocusedId,
	refs,
	handleSubmit,
	toggleHelp,
	setShowLaunchKeys,
}: KeyboardNavOptions) {
	const moveFocus = useCallback(
		(direction: "up" | "down") => {
			if (!flatUids.length) return;

			const idx = flatUids.indexOf(focusedId);
			if (idx < 0) return;
			const len = flatUids.length;

			const nextId =
				direction === "down"
					? flatUids[(idx + 1) % len]
					: flatUids[(idx - 1 + len) % len];

			setFocusedId(nextId);
			refs[nextId]?.current?.scrollIntoView({ block: "nearest" });
		},
		[flatUids, focusedId, refs, setFocusedId],
	);

	const onKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (!flatUids.length) return;

			if (e.ctrlKey) {
				setShowLaunchKeys(true);
			}

			switch (true) {
				case e.ctrlKey && /^[1-5]$/.test(e.key):
					e.preventDefault();
					console.log("Launch key pressed:", e.key);
					break;

				case e.key === "ArrowDown":
					e.preventDefault();
					moveFocus("down");
					break;

				case e.key === "ArrowUp":
					e.preventDefault();
					moveFocus("up");
					break;

				case e.key === "Enter":
					handleSubmit();
					break;

				case e.key === "Escape":
					ClutchServices.ToggleApp();
					break;

				case e.key === "F1":
					e.preventDefault();
					toggleHelp();
					break;

				default:
					return;
			}
		},
		[flatUids, moveFocus, handleSubmit, toggleHelp],
	);

	const onKeyUp = useCallback(
		(e: KeyboardEvent) => {
			if (!flatUids.length) return;

			if (e.ctrlKey) {
				setShowLaunchKeys(false);
			}
		},
		[flatUids, moveFocus, handleSubmit, toggleHelp],
	);

	useEffect(() => {
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	}, [onKeyDown]);
}
