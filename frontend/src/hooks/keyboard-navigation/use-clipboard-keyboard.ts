import { useHotkeys } from "@tanstack/react-hotkeys";
import { useRouter } from "@tanstack/react-router";
import { useClipboard } from "../useClipboard";

interface ClipboardEntry {
	id: string;
	content: string;
	timestamp: number;
	size: number;
}

interface UseClipboardKeyboardProps {
	inputRef: React.RefObject<HTMLInputElement | null>;
	filter: string;
	setFilter: (value: string) => void;
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
	filteredEntries: ClipboardEntry[];
	copy: (text: string) => Promise<boolean>;
	navigate: (opts: { to: string }) => void;
}

export function useClipboardKeyboard({
	inputRef,
	filter,
	setFilter,
	selectedIndex,
	setSelectedIndex,
	filteredEntries,
}: UseClipboardKeyboardProps) {
	const { copy } = useClipboard();
	const router = useRouter();

	useHotkeys([
		{
			hotkey: "/",
			callback: () => {
				inputRef.current?.focus();
			},
		},
		{
			hotkey: "Escape",
			callback: () => {
				if (filter) {
					setFilter("");
				} else {
					router.history.back();
				}
			},
		},
		{
			hotkey: "Backspace",
			callback: () => {
				inputRef.current?.focus();
				if (inputRef.current?.value !== "") return;
				router.history.back();
			},
			options: {
				preventDefault: false,
			},
		},
		{
			hotkey: "ArrowDown",
			callback: (e) => {
				e.preventDefault();
				const nextIndex = (selectedIndex + 1) % filteredEntries.length;
				setSelectedIndex(nextIndex);
			},
		},
		{
			hotkey: "ArrowUp",
			callback: (e) => {
				e.preventDefault();
				const prevIndex =
					(selectedIndex - 1 + filteredEntries.length) % filteredEntries.length;
				setSelectedIndex(prevIndex);
			},
		},
		{
			hotkey: "Enter",
			callback: async () => {
				const entry = filteredEntries[selectedIndex];
				if (!entry) return;
				await copy(entry.content);
			},
		},
	]);
}
