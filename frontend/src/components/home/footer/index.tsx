import { ArrowDown, ArrowUp } from "lucide-react";
import { Kbd } from "@/components/kbd";

export function Footer() {
	return (
		<footer className="flex h-[35px] w-full items-center justify-between border-t px-2">
			<div>Clutch</div>
			<div className="flex gap-1">
				<div className="flex items-center gap-1">
					<span className="text-xs">Press</span>
					<Kbd className="static">/</Kbd>
					<span className="text-xs">to focus input and </span>
				</div>
				<div className="flex items-center gap-1">
					<Kbd className="static">
						<ArrowDown size={14} />
					</Kbd>
					<Kbd className="static">
						<ArrowUp size={14} />
					</Kbd>
					<span className="text-xs">to navigate the list</span>
				</div>
			</div>
		</footer>
	);
}
