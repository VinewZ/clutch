import type { SectionedList } from "@/hooks/useSectionedlist";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { ListItem } from "../list_item";
import { Kbd } from "@/components/kbd";
import { useAction } from "@/hooks/useAction";

type SectionProps = {
  sectionKey: string;
  list: SectionedList["apps"] | SectionedList["extensions"] | SectionedList["routes"] | SectionedList["quicklinks"] | SectionedList["flatList"];
  selectedId: string;
  setSelectedId: Dispatch<SetStateAction<string>>;
  liRefs: RefObject<HTMLLIElement[]>;
  showLaunchKeys: boolean;
};

export function Section({ sectionKey, list, selectedId, setSelectedId, liRefs, showLaunchKeys }: SectionProps) {
  const actionHandler = useAction();
  return (
    <li>
      <p className="my-1.5 px-2 text-xs text-zinc-400 capitalize">{sectionKey}</p>
      <ul>
        {list.map((item, idx: number) => (
          <li
            key={item._uid}
            id={item._uid}
            ref={(el) => {
              if (el && liRefs) {
                liRefs.current[item._uid] = el;
              }
            }}
            onMouseEnter={() => setSelectedId(item._uid)}
            onMouseLeave={() => setSelectedId("")}
            onClick={() => actionHandler({ action: item._section.toLowerCase(), listItem: item })}
            className={cn(
              "mx-1 flex cursor-pointer items-center justify-between gap-2 rounded p-2 text-sm relative",
              selectedId === item._uid ? "bg-zinc-700" : "text-zinc-300",
            )}
          >
            <ListItem
              key={item._uid}
              item={item}
            />
            {showLaunchKeys && idx < 9 && item._section === "Apps" && (
              <Kbd className="-translate-y-1/2 absolute top-1/2 right-2 bg-zinc-800">
                {idx + 1}
              </Kbd>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}
