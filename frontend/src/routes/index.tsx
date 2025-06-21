import { Kbd } from "@/components/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigateList } from "@/hooks/useNavigateList";
import { useSectionedList } from "@/hooks/useSectionedlist";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConverterContainer } from "./-components/converter_container";
import { Footer } from "./-components/footer";
import { HelpDialog } from "./-components/help_dialog";
import { MainInput } from "./-components/main_input";
import { Section } from "./-components/section";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [search, setSearch] = useState("");
	const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
	const [showLaunchKeys, setShowLaunchKeys] = useState(false);
	const sectionedListItems = useSectionedList({ search });

	const liRefs = useRef<HTMLLIElement[]>([]);
	const [selectedId, setSelectedId] = useState("");
	const keyHandlers = useNavigateList({
		inputRef,
		liRefs,
		selectedId,
		setSelectedId,
		setSearch,
		setShowLaunchKeys,
		setIsHelpDialogOpen,
		flatList: sectionedListItems.flatList,
	});

	useEffect(() => {
		window.addEventListener("keydown", keyHandlers.keyDown);
		window.addEventListener("keyup", keyHandlers.keyUp);
		return () => {
			window.removeEventListener("keydown", keyHandlers.keyDown);
			window.removeEventListener("keyup", keyHandlers.keyUp);
		};
	}, [sectionedListItems]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		setSelectedId(sectionedListItems.flatList[0]?._uid || "");
	}, [search]);

	return (
		<main>
			<MainInput inputRef={inputRef} value={search} onChange={setSearch} />
			<ScrollArea className="mt-[50px] h-[515px]">
				<ConverterContainer input={search} />
				<ul className="flex h-full w-full flex-col overflow-hidden">
					{Object.entries(sectionedListItems).map(([key, list]) => {
						if (key === "flatList") return;
						if (search.startsWith(":") && key !== "quicklinks") return;
						return (
							<Section
								key={key}
								sectionKey={key}
								liRefs={liRefs}
								setSelectedId={setSelectedId}
								selectedId={selectedId}
								list={list}
								showLaunchKeys={showLaunchKeys}
							/>
						);
					})}
				</ul>
			</ScrollArea>
			<Footer />

			<HelpDialog
				isOpen={isHelpDialogOpen}
				setIsOpen={setIsHelpDialogOpen}
				title="Keybindings"
			>
				<div className="flex items-center gap-1">
					<span>Press</span>
					<Kbd>/</Kbd>
					<span>to focus input</span>
				</div>

				<div className="flex items-center gap-1">
					<span>Press</span>
					<Kbd>
						<ArrowUp size={12} />
					</Kbd>
					<Kbd>
						<ArrowDown size={12} />
					</Kbd>
					<span>to navigate list</span>
				</div>

				<div className="flex items-center gap-1">
					<span>Press</span>
					<Kbd>CTRL</Kbd>
					<Kbd>1</Kbd>
					<span>~</span>
					<Kbd>9</Kbd>
					<span>to quickly launch applications</span>
				</div>
			</HelpDialog>
		</main>
	);
}
