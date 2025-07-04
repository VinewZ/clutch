import { BackButton } from "@/components/back_button";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Blocks, Braces, Link as IconLink, Settings } from "lucide-react";

export const Route = createFileRoute("/settings")({
	component: RouteComponent,
});

const linkMenus = [
	{
		name: "General",
		to: "/settings/general",
		icon: Settings,
	},
	{
		name: "Extensions",
		to: "/settings/extensions",
		icon: Blocks,
	},
	{
		name: "Developers",
		to: "/settings/developers",
		icon: Braces,
	},
	{
		name: "Quicklinks",
		to: "/settings/quicklinks",
		icon: IconLink,
	},
];

function RouteComponent() {
	return (
		<div className="relative flex h-dvh text-white">
			<BackButton />
			<div className="w-54 pt-16">
				<span className="pl-4 text-xs text-zinc-200 capitalize">Settings</span>
				<div className="mt-2 flex flex-col gap-2 text-sm">
					{linkMenus.map((menu) => (
						<Link
							key={menu.name}
							className="mx-2 flex items-center justify-start gap-2 py-1.5 pl-2"
							to={menu.to}
							activeProps={{
								className: "px-2 rounded-md",
							}}
						>
							{<menu.icon className="size-4" />}
							{menu.name}
						</Link>
					))}
				</div>
			</div>
			<div className="flex-1 p-4 border-l">
				<Outlet />
			</div>
		</div>
	);
}
