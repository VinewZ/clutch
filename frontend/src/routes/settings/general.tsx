import { ModeToggle } from "@/components/settings/mode_toggle";
import { SelectLanguage } from "@/components/settings/select_language";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/general")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<Table>
			<TableBody>
				<TableRow>
					<TableCell>Theme</TableCell>
					<TableCell>
						<ModeToggle />
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>Language</TableCell>
					<TableCell>
						<SelectLanguage />
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}
