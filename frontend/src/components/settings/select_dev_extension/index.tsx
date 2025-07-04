import { Button } from "@/components/ui/button";
import type { ExtJson } from "@/routes/settings/developers";
import { Dialogs } from "@wailsio/runtime";
import { Check, FolderCode } from "lucide-react";
import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ClutchServices } from "../../../../bindings/github.com/vinewz/clutch/app/index";

type SelectDevExtensionProps = {
	setDevExtension: Dispatch<SetStateAction<ExtJson | undefined>>;
};

export function SelectDevExtension({
	setDevExtension,
}: SelectDevExtensionProps) {
	const [extensionPath, setExtensionPath] = useState("");
	const isJson = extensionPath.includes("package.json");

	useEffect(() => {
		if (extensionPath) {
			try {
				ClutchServices.ParseExtensionPkgJson(extensionPath).then((r) => {
					if (r) {
						setDevExtension(r);
					}
				});
			} catch (error) {
				console.log(error);
			}
		}
	}, [extensionPath]);

	return (
		<div>
			<div className="mb-5 w-full">
				<Button
					variant="ghost"
					className="flex h-fit w-full cursor-pointer flex-col items-center justify-center gap-0 rounded-2xl border border-gray-300 border-dashed bg-zinc-800 py-9 transition-colors hover:bg-zinc-700"
					onClick={async () => {
						const res = await Dialogs.OpenFile({
							AllowsMultipleSelection: false,
						});
						setExtensionPath(res);
					}}
				>
					<div className="mb-3 flex items-center justify-center">
						{extensionPath ? (
							<Check className="size-12" />
						) : (
							<FolderCode className="size-12" />
						)}
					</div>
					<span className="mb-1 text-center font-normal text-xs text-zinc-400 leading-4">
						Click to open
					</span>
					{extensionPath ? (
						<div>
							<span>Selected:</span>
							{isJson ? (
								<div className="flex flex-col">
									<span>HMR Enabled</span>
									<span>{extensionPath}</span>
								</div>
							) : (
								<div className="flex flex-col">
									<span>STATIC Enabled</span>
									<span>{extensionPath}</span>
								</div>
							)}
						</div>
					) : (
						<div className="flex flex-col gap-1">
							<span className="text-center font-medium text-sm text-zinc-400 leading-snug">
								Selected a{" "}
								<span className="font-bold italic">package.json</span> for{" "}
								<span className="font-bold italic">HMR</span>
							</span>
							<span className="text-center font-medium text-sm text-zinc-400 leading-snug">
								Selected an <span className="font-bold italic">index.html</span>{" "}
								for <span className="font-bold italic">STATIC</span>
							</span>
						</div>
					)}
				</Button>
			</div>
		</div>
	);
}
