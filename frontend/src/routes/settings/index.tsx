import { createFileRoute } from "@tanstack/react-router";
import { ModeToggle } from "@/components/ModeToggle";

export const Route = createFileRoute("/settings/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="h-full overflow-y-auto">
			<ModeToggle />
		</div>
	);
}
