import {
	Tooltip,
	TooltipTrigger,
	TooltipProvider,
	TooltipContent,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ItemProps = {
	item: {
		_uid: string;
		name?: string;
		label?: string;
		clutch?: { name: string };
		command?: string;
		icon?: string;
		exec?: string;
	};
	isFocused: boolean;
	handleSubmit: () => void;
	setFocusedId: (id: string) => void;
};

export const ListItem = forwardRef<HTMLLIElement, ItemProps>(
	({ item, isFocused, handleSubmit, setFocusedId }, ref) => {
		const label =
			item.name || item.label || item.clutch?.name || item.command || "—";

		return (
			<li
				ref={ref}
				id={item._uid}
				onClick={handleSubmit}
				onMouseEnter={() => setFocusedId(item._uid)}
				onMouseLeave={() => setFocusedId("")}
				className={cn(
					"mx-1 flex cursor-pointer items-center justify-between gap-2 rounded p-2 text-sm",
					isFocused ? "bg-zinc-700" : "text-zinc-300",
				)}
			>
				<div className="flex items-center gap-1">
					{item.icon && <img className="size-4" src={item.icon} />}
					{item.command && <span>{item.command} – </span>}
					<span>{label}</span>
				</div>
				{item.exec && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>
								<Info size={16} />
							</TooltipTrigger>
							<TooltipContent>
								<p>Runs: {item.exec}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</li>
		);
	},
);
