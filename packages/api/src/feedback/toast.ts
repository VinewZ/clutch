import {
	createContext,
	createElement,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
} from "react";

type ToastStyle = "SUCCESS" | "FAILURE" | "ANIMATED";

interface ToastOptions {
	style?: ToastStyle;
	title: string;
	message?: string;
}

interface ToastContextValue {
	send: (type: string, toastId: string, data: Record<string, unknown>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const Style = {
	Success: "SUCCESS" as ToastStyle,
	Failure: "FAILURE" as ToastStyle,
	Animated: "ANIMATED" as ToastStyle,
};

let toastCounter = 0;

class Toast {
	#id: string;
	#send: (type: string, toastId: string, data: Record<string, unknown>) => void;
	#style: ToastStyle;
	#title: string;
	#message: string | undefined;

	constructor(
		id: string,
		options: ToastOptions,
		send: (
			type: string,
			toastId: string,
			data: Record<string, unknown>,
		) => void,
	) {
		this.#id = id;
		this.#send = send;
		this.#style = options.style ?? Style.Success;
		this.#title = options.title;
		this.#message = options.message;
	}

	get style(): ToastStyle {
		return this.#style;
	}

	set style(value: ToastStyle) {
		this.#style = value;
		this.#send("toastUpdate", this.#id, { style: value });
	}

	get title(): string {
		return this.#title;
	}

	set title(value: string) {
		this.#title = value;
		this.#send("toastUpdate", this.#id, { title: value });
	}

	get message(): string | undefined {
		return this.#message;
	}

	set message(value: string | undefined) {
		this.#message = value;
		this.#send("toastUpdate", this.#id, { message: value ?? null });
	}

	async hide(): Promise<void> {
		this.#send("toastHide", this.#id, {});
	}

	async show(): Promise<void> {
		this.#send("toastShow", this.#id, {
			style: this.#style,
			title: this.#title,
			message: this.#message ?? null,
		});
	}
}

async function showToast(options: ToastOptions): Promise<Toast> {
	const sendFn = (globalThis as unknown as Record<string, unknown>)
		.__clutchToastSend as ToastContextValue["send"] | undefined;

	if (!sendFn) {
		console.error("[Toast] __clutchToastSend not available on globalThis");
		const id = `toast-${++toastCounter}`;
		return new Toast(id, options, () => {});
	}

	const id = `toast-${++toastCounter}`;
	const toast = new Toast(id, options, sendFn);
	sendFn("toastShow", id, {
		style: options.style ?? Style.Success,
		title: options.title,
		message: options.message ?? null,
	});
	return toast;
}

function ToastProvider({ children }: { children: ReactNode }) {
	const sendRef = useRef<ToastContextValue["send"]>(() => {});

	sendRef.current = useCallback(
		(type: string, toastId: string, data: Record<string, unknown>) => {
			const socketSend = (globalThis as unknown as Record<string, unknown>)
				.__clutchSocketSend as
				| ((msg: Record<string, unknown>) => void)
				| undefined;

			if (!socketSend) {
				console.error("[Toast] __clutchSocketSend not available");
				return;
			}

			const extensionId = (globalThis as unknown as Record<string, unknown>)
				.__clutchExtensionId as string | undefined;

			const msg: Record<string, unknown> = {
				category: "RUNTIME",
				type,
				extensionId: extensionId ?? "",
				toastId,
				...data,
			};

			socketSend(msg);
		},
		[],
	);

	useEffect(() => {
		if (typeof globalThis !== "undefined") {
			(globalThis as unknown as Record<string, unknown>).__clutchToastSend =
				sendRef.current;
		}
		return () => {
			if (typeof globalThis !== "undefined") {
				delete (globalThis as unknown as Record<string, unknown>)
					.__clutchToastSend;
			}
		};
	}, []);

	return createElement(
		ToastContext.Provider,
		{ value: { send: sendRef.current } },
		children,
	);
}

export { showToast, ToastProvider, Toast, Style };
export type { ToastOptions, ToastStyle };
