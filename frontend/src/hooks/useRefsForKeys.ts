import type { RefObject } from "react";
import { createRef, useMemo, useRef } from "react";

export function useRefsForKeys<T>(
	keys: string[],
): Record<string, RefObject<T | null>> {
	const ref = useRef<Record<string, RefObject<T | null>>>({});

	useMemo(() => {
		for (const key of keys) {
			if (!ref.current[key]) {
				ref.current[key] = createRef<T>();
			}
		}
	}, [keys]);

	return ref.current;
}
