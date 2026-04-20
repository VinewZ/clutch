import { useEffect, useState } from "react";
import type { ToastData } from "@/services/extension";

interface ToastState {
	toastId: string;
	style: string;
	title: string;
	message?: string;
}

const AUTO_DISMISS_MS = 3000;

const styleConfig: Record<
	string,
	{ icon: string; bg: string; border: string; text: string }
> = {
	SUCCESS: {
		icon: "✓",
		bg: "bg-green-50 dark:bg-green-950/60",
		border: "border-green-200 dark:border-green-800",
		text: "text-green-800 dark:text-green-200",
	},
	FAILURE: {
		icon: "✕",
		bg: "bg-red-50 dark:bg-red-950/60",
		border: "border-red-200 dark:border-red-800",
		text: "text-red-800 dark:text-red-200",
	},
	ANIMATED: {
		icon: "⏳",
		bg: "bg-blue-50 dark:bg-blue-950/60",
		border: "border-blue-200 dark:border-blue-800",
		text: "text-blue-800 dark:text-blue-200",
	},
};

export function ToastContainer({
	toast,
	onDismiss,
}: {
	toast: ToastState | null;
	onDismiss: () => void;
}) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!toast) {
			setVisible(false);
			return;
		}

		setVisible(true);

		if (toast.style !== "ANIMATED") {
			const timer = setTimeout(() => {
				setVisible(false);
				setTimeout(onDismiss, 200);
			}, AUTO_DISMISS_MS);
			return () => clearTimeout(timer);
		}
	}, [toast, onDismiss]);

	if (!toast) return null;

	const config = styleConfig[toast.style] ?? styleConfig.SUCCESS;

	return (
		<div
			className={`
				fixed bottom-4 left-1/2 -translate-x-1/2 z-50
				flex items-center gap-2 px-4 py-2.5
				rounded-lg border shadow-lg
				transition-all duration-200
				${config.bg} ${config.border}
				${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
			`}
		>
			<span className={`text-sm font-semibold ${config.text}`}>
				{config.icon}
			</span>
			<div className="flex flex-col">
				<span className={`text-sm font-medium ${config.text}`}>
					{toast.title}
				</span>
				{toast.message && (
					<span className="text-xs text-muted-foreground">{toast.message}</span>
				)}
			</div>
		</div>
	);
}

export function useToastState() {
	const [toast, setToast] = useState<ToastState | null>(null);

	const handleToastData = (data: ToastData) => {
		switch (data.type) {
			case "toastShow":
				setToast({
					toastId: data.toastId,
					style: data.style ?? "SUCCESS",
					title: data.title ?? "",
					message: data.message,
				});
				break;
			case "toastUpdate":
				setToast((prev) => {
					if (!prev || prev.toastId !== data.toastId) return prev;
					return {
						...prev,
						...(data.style != null && { style: data.style }),
						...(data.title != null && { title: data.title }),
						...(data.message != null && { message: data.message }),
					};
				});
				break;
			case "toastHide":
				setToast((prev) => {
					if (prev?.toastId === data.toastId) return null;
					return prev;
				});
				break;
		}
	};

	const dismissToast = () => setToast(null);

	return { toast, handleToastData, dismissToast };
}
