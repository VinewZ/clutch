import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { Quicklink } from "@/routes/settings/quicklinks";
import type { ReactNode } from "@tanstack/react-router";
import { useState } from "react";

type QuicklinkDeleteProps = {
	quicklink: Quicklink;
	children: ReactNode;
	handleDelete: (command: string) => void;
};

export function QuicklinkDelete({
	children,
	quicklink,
	handleDelete,
}: QuicklinkDeleteProps) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	return (
		<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
			<DialogTrigger className="cursor-pointer">{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
				</DialogHeader>
				<DialogDescription className="flex flex-col gap-2">
					<span>This action cannot be undone.</span>
					<blockquote className="flex justify-between rounded-md bg-zinc-900 p-3 text-zinc-500">
						<span>{quicklink.command}</span>
						<span>{quicklink.link}</span>
					</blockquote>
				</DialogDescription>
				<DialogFooter>
					<Button
						variant="outline"
						className="cursor-pointer"
						onClick={() => setDeleteDialogOpen(false)}
					>
						Cancel
					</Button>
					<Button
						className="cursor-pointer"
						onClick={() => handleDelete(quicklink.command)}
					>
						Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
