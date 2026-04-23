import {
	createContext,
	createElement,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

interface NavigationContextValue {
	push: (component: ReactNode, onPop?: () => void) => void;
	pop: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
	const [stack, setStack] = useState<ReactNode[]>(() => [children]);
	const popCallbacksRef = useRef<Map<number, () => void>>(new Map());

	const push = useCallback((component: ReactNode, onPop?: () => void) => {
		setStack((prev) => {
			const newStack = [...prev, component];
			if (onPop) {
				popCallbacksRef.current.set(newStack.length - 1, onPop);
			}
			return newStack;
		});
	}, []);

	const pop = useCallback(() => {
		setStack((prev) => {
			if (prev.length <= 1) return prev;

			const topIndex = prev.length - 1;
			const callback = popCallbacksRef.current.get(topIndex);
			if (callback) {
				callback();
				popCallbacksRef.current.delete(topIndex);
			}

			return prev.slice(0, -1);
		});
	}, []);

	useEffect(() => {
		if (typeof globalThis !== "undefined") {
			(globalThis as unknown as Record<string, unknown>).__clutchNavigationPop =
				pop;
		}
		return () => {
			if (typeof globalThis !== "undefined") {
				delete (globalThis as unknown as Record<string, unknown>)
					.__clutchNavigationPop;
			}
		};
	}, [pop]);

	const currentView = stack[stack.length - 1];

	return createElement(
		"NavigationContainer",
		{ navigationDepth: stack.length },
		createElement(
			NavigationContext.Provider,
			{ value: { push, pop } },
			currentView,
		),
	);
}

export function useNavigation(): NavigationContextValue {
	const context = useContext(NavigationContext);
	if (!context) {
		throw new Error("useNavigation must be used within NavigationProvider");
	}
	return context;
}
