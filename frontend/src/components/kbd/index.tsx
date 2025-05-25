import { cn } from "@/lib/utils";
import type { ReactNode } from "react";


type KbdProps = {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd className={cn(
      "absolute right-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground translate-x-0 transition-all duration-200",
      className
    )} >
      {children}
    </kbd>
  )

}
