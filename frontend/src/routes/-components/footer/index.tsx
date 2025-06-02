import { Kbd } from "@/components/kbd";

export function Footer() {
	return (
		<footer className="flex h-[35px] w-full items-center justify-between border-t px-2">
			<div>Clutch</div>
			<div className="flex items-center gap-1">
				<span className="text-xs">Press</span>
				<Kbd>F1</Kbd>
				<span className="text-xs">to show help</span>
			</div>
		</footer>
	);
}
