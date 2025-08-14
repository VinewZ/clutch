import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Dispatch, ReactNode, SetStateAction } from "react";

type HelpDialogProps = {
	title: string;
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	children: ReactNode;
};

export function HelpDialog({
	title,
	isOpen,
	setIsOpen,
	children,
}: HelpDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<Separator className="my-2" />
					<DialogDescription className="space-y-3">
						{children}
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
