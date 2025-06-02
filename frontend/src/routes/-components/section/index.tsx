import type { RefObject } from "react";
import { ListItem } from "../list_item";
import { Kbd } from "@/components/kbd";

type SectionProps<T> = {
	sectionKey: string;
	list: T[];
	focusedId: string;
	refs: Record<string, RefObject<HTMLLIElement | null>>;
	handleSubmit: () => void;
	setFocusedId: (id: string) => void;
	showLaunchKeys: boolean;
};

export function Section<T extends { _uid: string }>({
	sectionKey,
	list,
	focusedId,
	refs,
	handleSubmit,
	setFocusedId,
	showLaunchKeys,
}: SectionProps<T>) {
	return (
		<li>
			<p className="my-1.5 px-2 text-xs text-zinc-400 capitalize">
				{sectionKey}
			</p>
			<ul>
				{list.map((item, idx) => (
					<div className="relative" key={item._uid}>
						<ListItem
							item={item}
							isFocused={item._uid === focusedId}
							ref={refs.current?.[item._uid]}
							handleSubmit={handleSubmit}
							setFocusedId={setFocusedId}
						/>
						{showLaunchKeys && idx <= 5 && (
							<Kbd className="-translate-y-1/2 absolute top-1/2 right-2 bg-zinc-800">
								{idx + 1}
							</Kbd>
						)}
					</div>
				))}
			</ul>
		</li>
	);
}
