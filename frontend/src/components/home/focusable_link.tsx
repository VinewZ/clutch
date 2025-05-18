import { useRef } from "react";
import { useFocusEffect, useRovingTabIndex } from "react-roving-tabindex";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type FocusableLinkProps = {
  label: string;
  path: string;
  disabled?: boolean;
};

export function FocusableLink({
  label,
  path,
  disabled = false,
}: FocusableLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const [tabIndex, focused, handleKeyDown, handleClick] = useRovingTabIndex(
    // @ts-ignore
    ref,
    disabled,
  );

  // @ts-ignore
  useFocusEffect(focused, ref);

  return (
    <Link
      to={path}
      ref={ref}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      className={cn(
        "mx-1 flex items-center gap-2 rounded p-2 text-sm font-medium",
        focused ? "bg-zinc-700" : "text-zinc-300",
      )}
      role="option" // optional ARIA role
      aria-disabled={disabled} // reflect disabled state
    >
      {label}
    </Link>
  );
}
