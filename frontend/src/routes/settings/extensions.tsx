import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { ClutchServices } from "../../../bindings/github.com/vinewz/clutch/app/index";

export const Route = createFileRoute("/settings/extensions")({
	component: RouteComponent,
});

function RouteComponent() {
	const [error, setError] = useState("");

	async function installExtension(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const url = formData.get("url") as string;
		if (!url) {
			toast("Please enter a valid URL", {
				type: "error",
			});
			return;
		}

		try {
			const res = await ClutchServices.DownloadExtension(url);
			toast(`${res} downloaded`);
			setError("");
		} catch (error) {
			console.log(error);
			toast("Failed to install extension", {
				type: "error",
			});
			setError(String(error));
		}
	}

	return (
		<div>
			<h1 className="font-bold text-2xl">Extensions</h1>
			<span className="text-xs text-zinc-400">Install Extension</span>
			<form className="mt-1 flex gap-2" onSubmit={installExtension}>
				<Input placeholder="https://github.com/OWNER/REPO" name="url" />
				<Button>Install</Button>
			</form>
			{error && <p className="pt-1.5 text-red-500 text-xs">{error}</p>}
		</div>
	);
}
