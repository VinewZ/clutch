export interface KeyboardShortcut {
	key: string;
	shift?: boolean;
	alt?: boolean;
	ctrl?: boolean;
	meta?: boolean;
	cmd?: boolean;
	modifiers?: string[];
}

export const Keyboard = {
	Shortcut: {
		Common: {
			MoveUp: "Keyboard.Shortcut.Common.MoveUp" as const,
			MoveDown: "Keyboard.Shortcut.Common.MoveDown" as const,
			CopyClipboard: "Keyboard.Shortcut.Common.CopyClipboard" as const,
			PasteClipboard: "Keyboard.Shortcut.Common.PasteClipboard" as const,
			SelectAll: "Keyboard.Shortcut.Common.SelectAll" as const,
			Cut: "Keyboard.Shortcut.Common.Cut" as const,
			Undo: "Keyboard.Shortcut.Common.Undo" as const,
			Redo: "Keyboard.Shortcut.Common.Redo" as const,
			Search: "Keyboard.Shortcut.Common.Search" as const,
			Delete: "Keyboard.Shortcut.Common.Delete" as const,
			Tab: "Keyboard.Shortcut.Common.Tab" as const,
			ReverseTab: "Keyboard.Shortcut.Common.ReverseTab" as const,
		},
	},
} as const;
