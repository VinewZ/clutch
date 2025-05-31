import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type KbdProps = {
	children: ReactNode;
	className?: string;
};

export function Kbd({ children, className }: KbdProps) {
	return (
		<kbd
			className={cn(
				"pointer-events-none absolute right-2 inline-flex h-5 translate-x-0 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground transition-all duration-200",
				className,
			)}
		>
			{children}
		</kbd>
	);
}
