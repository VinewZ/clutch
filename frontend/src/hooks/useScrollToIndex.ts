import { useEffect } from "react";

export interface UseScrollToIndexOptions {
	selectedIndex: number;
	enabled?: boolean;
}

export function useScrollToIndex({
	selectedIndex,
	enabled = true,
}: UseScrollToIndexOptions) {
	useEffect(() => {
		if (!enabled) return;
		const element = document.querySelector(`[data-index="${selectedIndex}"]`);
		element?.scrollIntoView({ block: "nearest" });
	}, [selectedIndex, enabled]);
}
