import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSearchInputOptions {
	debounceMs?: number;
	onClear?: () => void;
}

export function useSearchInput({
	debounceMs = 300,
	onClear,
}: UseSearchInputOptions = {}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
		}, debounceMs);
		return () => clearTimeout(timer);
	}, [searchQuery, debounceMs]);

	const clearInput = useCallback(() => {
		setSearchQuery("");
		onClear?.();
	}, [onClear]);

	const focusInput = useCallback(() => {
		inputRef.current?.focus();
	}, []);

	const isInputEmpty = searchQuery === "";
	const isInputFocused = () => document.activeElement === inputRef.current;

	return {
		searchQuery,
		setSearchQuery,
		debouncedQuery,
		inputRef,
		clearInput,
		focusInput,
		isInputEmpty,
		isInputFocused,
	};
}
