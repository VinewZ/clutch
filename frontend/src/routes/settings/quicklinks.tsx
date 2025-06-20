import { QuicklinkDelete } from "@/components/settings/quicklink_delete";
import { QuicklinkEdit } from "@/components/settings/quicklink_edit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { createFileRoute } from "@tanstack/react-router";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Edit, Trash } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

export const Route = createFileRoute("/settings/quicklinks")({
	component: RouteComponent,
});

export type Quicklink = {
	icon: string;
	name: string;
	command: string;
	link: string;
};

function RouteComponent() {
	const [quicklinks, setQuicklinks] = useLocalStorage<Quicklink[]>(
		"quickLinks",
		[],
	);
	const [error, setError] = useState("");

	function handleAdd(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name");
		const cmd = formData.get("command");
		const link = formData.get("link");
		if (!name || !cmd || !link) return;

		const cmdExist = quicklinks.find((qklink) => qklink.command === cmd);
		if (cmdExist) {
			setError(
				`Command already exists: ${cmdExist.command} - ${cmdExist.link}`,
			);
			return;
		}

		const newLink: Quicklink = {
			icon: `https://s2.googleusercontent.com/s2/favicons?domain=${link}`,
			name: name.toString(),
			command: `:${cmd.toString()}`,
			link: link.toString(),
		};

		setQuicklinks((prev) => [newLink, ...prev]);
		e.currentTarget.reset();
		setError("");
	}

	function handleDelete(command: string) {
		setQuicklinks((prev) =>
			prev.filter((qklink) => qklink.command !== command),
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4">
				<h1 className="font-semibold text-2xl">Quick Links</h1>
				<p className="text-sm text-zinc-500">
					Add custom commands to quickly access links.
					<br />
					For example, you can add a command like "gl" for Google search.
				</p>
			</div>

			<form className="flex flex-col gap-4" onSubmit={handleAdd}>
				<div className="flex gap-2">
					<Label className="flex w-full flex-col items-start text-xs text-zinc-400">
						Name
						<Input placeholder="Google" name="name" required />
					</Label>
					<Label className="flex w-full flex-col items-start text-xs text-zinc-400">
						Command
						<Input placeholder="gg" name="command" required />
					</Label>
				</div>
				<Label className="flex w-full flex-col items-start text-xs text-zinc-400">
					Link
					<Input
						placeholder="https://www.google.com/search?q="
						name="link"
						required
					/>
				</Label>
				<Button className="cursor-pointer" type="submit">
					Add
				</Button>
			</form>
			{error && <span className="text-red-500 text-xs">{error}</span>}

			<Table>
				<TableBody>
					{quicklinks.map((quicklink) => (
						<TableRow key={quicklink.command}>
							<TableCell className="p-0" width={36} height={36}>
								<img src={quicklink.icon} />
							</TableCell>
							<TableCell>{quicklink.name}</TableCell>
							<TableCell>{quicklink.command}</TableCell>
							<TableCell>{quicklink.link}</TableCell>
							<TableCell>
								<span className="flex items-center gap-2">
									<QuicklinkEdit quicklink={quicklink}>
										<Edit size={16} />
									</QuicklinkEdit>
									<QuicklinkDelete
										quicklink={quicklink}
										handleDelete={handleDelete}
									>
										<Trash size={16} />
									</QuicklinkDelete>
								</span>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
