import type { Dispatch, SetStateAction } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/kbd";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, ArrowUp } from "lucide-react";

type HelpDialogProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export function HelpDialog({ isOpen, setIsOpen }: HelpDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Keybinds</DialogTitle>
					<Separator className="my-2" />
					<DialogDescription className="space-y-3">
						<div className="flex items-center gap-1">
							<span>Press</span>
							<Kbd>/</Kbd>
							<span>to focus input</span>
						</div>

						<div className="flex items-center gap-1">
							<span>Press</span>
							<Kbd>
								<ArrowUp size={12} />{" "}
							</Kbd>
							<Kbd>
								<ArrowDown size={12} />{" "}
							</Kbd>
							<span>to navigate list</span>
						</div>

						<div className="flex items-center gap-1">
							<span>Press</span>
							<Kbd>CTRL</Kbd>
							<Kbd>1</Kbd>
							<span>...</span>
							<Kbd>5</Kbd>
							<span>to quickly launch applications</span>
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
