import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type FocusableLinkProps = {
	label: string;
	path: string;
};

export function FocusableLink({ label, path }: FocusableLinkProps) {
	return (
		<Link
			to={path}
			className={cn(
				"mx-1 flex items-center gap-2 rounded p-2 font-medium text-sm",
				// focused ? "bg-zinc-700" : "text-zinc-300",
			)}
		>
			{label}
		</Link>
	);
}
