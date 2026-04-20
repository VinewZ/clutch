import {
	createContext,
	createElement,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

interface NavigationContextValue {
	push: (component: ReactNode, onPop?: () => void) => void;
	pop: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
	const [stack, setStack] = useState<ReactNode[]>(() => [children]);
	const [popCallbacks, setPopCallbacks] = useState<Map<number, () => void>>(
		new Map(),
	);

	const push = useCallback((component: ReactNode, onPop?: () => void) => {
		setStack((prev) => {
			const newStack = [...prev, component];
			if (onPop) {
				setPopCallbacks((callbacks) => {
					const next = new Map(callbacks);
					next.set(newStack.length - 1, onPop);
					return next;
				});
			}
			return newStack;
		});
	}, []);

	const pop = useCallback(() => {
		setStack((prev) => {
			if (prev.length <= 1) return prev;

			const topIndex = prev.length - 1;
			const callback = popCallbacks.get(topIndex);
			if (callback) {
				callback();
				setPopCallbacks((callbacks) => {
					const next = new Map(callbacks);
					next.delete(topIndex);
					return next;
				});
			}

			return prev.slice(0, -1);
		});
	}, [popCallbacks]);

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
		NavigationContext.Provider,
		{ value: { push, pop } },
		currentView,
	);
}

export function useNavigation(): NavigationContextValue {
	const context = useContext(NavigationContext);
	if (!context) {
		throw new Error("useNavigation must be used within NavigationProvider");
	}
	return context;
}
