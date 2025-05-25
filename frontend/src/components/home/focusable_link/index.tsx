import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { Ref } from "react";

type FocusableLinkProps = {
  ref: Ref<HTMLAnchorElement> | undefined
  focused: boolean;
  label: string;
  path: string;
};

export function FocusableLink({
  ref,
  focused,
  label,
  path,
}: FocusableLinkProps) {
  return (
    <Link
      ref={ref}
      to={path}
      className={cn(
        "mx-1 flex items-center gap-2 rounded p-2 text-sm font-medium",
        focused ? "bg-zinc-700" : "text-zinc-300",
      )}
    >
      {label}
    </Link>
  );
}
