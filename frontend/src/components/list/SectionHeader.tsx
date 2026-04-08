interface SectionHeaderProps {
	section: "apps" | "routes";
}

export function SectionHeader({ section }: SectionHeaderProps) {
	return (
		<div className="px-4 py-2 text-sm font-semibold text-muted-foreground uppercase bg-muted/50">
			{section}
		</div>
	);
}
