import { createFileRoute } from "@tanstack/react-router";
import { ModeToggle } from "@/components/ui/mode-toggle";

export const Route = createFileRoute("/settings/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="p-6">
			<h1 className="text-lg font-semibold mb-4">Appearance</h1>
			<ModeToggle />
		</div>
	);
}
