import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	CheckCircle2,
	Circle,
	Download,
	ExternalLink,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { formatCount } from "@/lib/utils";
import { useTheme } from "@/providers/theme";
import {
	useExtensions,
	useInstallExtension,
	useUninstallExtension,
} from "@/services/store";

export const Route = createFileRoute("/store/$id")({
	component: ExtensionDetailPage,
});

function ExtensionDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const { theme } = useTheme();
	const effectiveTheme =
		theme === "system"
			? window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light"
			: theme;

	const extensionsQuery = useExtensions();
	const installMutation = useInstallExtension();
	const uninstallMutation = useUninstallExtension();

	const extension = extensionsQuery.data?.find((ext) => ext.id === id);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				navigate({ to: "/store" });
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [navigate]);

	const handleInstall = useCallback(() => {
		if (!extension) return;
		installMutation.mutate(extension.id);
	}, [extension, installMutation]);

	const handleUninstall = useCallback(() => {
		if (!extension) return;
		uninstallMutation.mutate(extension.name);
	}, [extension, uninstallMutation]);

	if (extensionsQuery.isLoading) {
		return (
			<div className="h-screen flex items-center justify-center">
				Loading extension details...
			</div>
		);
	}

	if (!extension) {
		return (
			<div className="h-screen flex items-center justify-center text-red-500">
				Extension not found
			</div>
		);
	}

	const iconSrc =
		extension.icons[effectiveTheme] ||
		extension.icons[effectiveTheme === "dark" ? "light" : "dark"];

	return (
		<div className="flex flex-col h-full overflow-hidden">
			<div className="shrink-0 flex items-center gap-2 p-4 border-b border-border">
				<button
					type="button"
					onClick={() => navigate({ to: "/store" })}
					className="p-1 rounded hover:bg-accent"
				>
					<ArrowLeft className="size-5" />
				</button>
				<span className="text-sm text-muted-foreground">Back to Store</span>
			</div>

			<div className="flex-1 overflow-y-auto p-6 space-y-6">
				<div className="flex items-start gap-4">
					{iconSrc && (
						<img
							width={48}
							height={48}
							className="rounded-lg shrink-0"
							src={iconSrc}
							alt={extension.title}
						/>
					)}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-bold truncate">{extension.title}</h1>
							{extension.installed ? (
								<CheckCircle2 className="size-5 shrink-0 text-green-500" />
							) : (
								<Circle className="size-5 shrink-0 text-muted-foreground/40" />
							)}
						</div>
						<p className="text-muted-foreground mt-1">
							{extension.description}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-6">
					{extension.author && (
						<div className="flex items-center gap-2">
							{extension.author.avatar && (
								<img
									width={24}
									height={24}
									className="rounded-full"
									src={extension.author.avatar}
									alt={extension.author.name}
								/>
							)}
							<span className="text-sm">{extension.author.name}</span>
							{extension.author.handle && (
								<span className="text-sm text-muted-foreground">
									@{extension.author.handle}
								</span>
							)}
						</div>
					)}
					<div className="flex items-center gap-1.5">
						<Download className="size-4 text-muted-foreground" />
						<span className="text-sm">
							{formatCount(extension.download_count)}
						</span>
					</div>
				</div>

				{extension.categories && extension.categories.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{extension.categories.map((cat) => (
							<span
								key={cat}
								className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
							>
								{cat}
							</span>
						))}
					</div>
				)}

				{extension.commands && extension.commands.length > 0 && (
					<div className="space-y-3">
						<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
							Commands
						</h2>
						<div className="divide-y divide-border rounded-md border border-border">
							{extension.commands.map((cmd) => (
								<div key={cmd.name} className="flex items-center gap-3 p-3">
									<div className="flex-1 min-w-0">
										<p className="font-medium truncate">{cmd.title}</p>
										{cmd.description && (
											<p className="text-sm text-muted-foreground truncate">
												{cmd.description}
											</p>
										)}
									</div>
									<span className="shrink-0 px-2 py-0.5 text-xs rounded bg-secondary text-secondary-foreground">
										{cmd.mode}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				<div className="flex items-center gap-4">
					{extension.source_url && (
						<a
							href={extension.source_url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-sm text-primary hover:underline"
						>
							<ExternalLink className="size-4" />
							Source
						</a>
					)}
					{extension.store_url && (
						<a
							href={extension.store_url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-sm text-primary hover:underline"
						>
							<ExternalLink className="size-4" />
							Raycast Store
						</a>
					)}
				</div>

				<div className="pt-2">
					{extension.installed ? (
						<button
							type="button"
							onClick={handleUninstall}
							disabled={uninstallMutation.isPending}
							className="w-full px-4 py-2 text-sm border border-border rounded hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
						>
							Uninstall
						</button>
					) : (
						<button
							type="button"
							onClick={handleInstall}
							disabled={installMutation.isPending}
							className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
						>
							Install
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
