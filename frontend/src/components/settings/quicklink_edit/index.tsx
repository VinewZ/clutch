import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Quicklink } from "@/routes/settings/quicklinks";
import type { ReactNode } from "@tanstack/react-router";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useState, type FormEvent } from "react";

type QuicklinkEditProps = {
	quicklink: Quicklink;
	children: ReactNode;
};

export function QuicklinkEdit({ children, quicklink }: QuicklinkEditProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [quicklinks, setQuicklinks] = useLocalStorage<Quicklink[]>(
		"quickLinks",
		[],
	);
	const [name, setName] = useState(quicklink.name);
	const [command, setCommand] = useState(quicklink.command);
	const [link, setLink] = useState(quicklink.link);

	function handleEdit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const newLink: Quicklink = {
			icon: `https://s2.googleusercontent.com/s2/favicons?domain=${link}`,
			name: name,
			command: command,
			link: link,
		};

		const updatedLinks = quicklinks.map((qklink) => {
			if (qklink.command === quicklink.command) return newLink;
			return qklink;
		});

		setQuicklinks(updatedLinks);
		setIsDialogOpen(false);
		setName("");
		setCommand("");
		setLink("");
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger className="cursor-pointer">{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit your quicklink</DialogTitle>
					<DialogDescription className="my-6">
						<blockquote className="flex justify-between rounded-md bg-zinc-900 p-3 text-zinc-500">
							<span>{quicklink.name}</span>
							<span>{quicklink.command}</span>
							<span>{quicklink.link}</span>
						</blockquote>
					</DialogDescription>

					<form className="flex flex-col gap-5" onSubmit={handleEdit}>
						<div className="flex gap-1">
							<Label className="flex w-full flex-col items-start text-xs placeholder:text-zinc-400">
								Name
								<Input
									placeholder="Google"
									required
									value={name}
									onChange={(e) => setName(e.currentTarget.value)}
								/>
							</Label>
							<Label className="flex w-full flex-col items-start text-xs placeholder:text-zinc-400">
								Command
								<Input
									placeholder="gl"
									required
									value={command}
									onChange={(e) => setCommand(e.currentTarget.value)}
								/>
							</Label>
						</div>
						<Label className="flex w-full flex-col items-start text-xs placeholder:text-zinc-400">
							Link
							<Input
								placeholder="https://www.google.com/search?q="
								required
								value={link}
								onChange={(e) => setLink(e.currentTarget.value)}
							/>
						</Label>
						<Button className="cursor-pointer" type="submit">
							Edit
						</Button>
					</form>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
