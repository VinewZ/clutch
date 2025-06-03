import type { RefObject } from "react";
import type { SectionedList } from "@/hooks/useSectionedlist";
import { ListItem } from "../list_item";
import { Kbd } from "@/components/kbd";

type SectionProps = {
  sectionKey: string;
  list: SectionedList["apps"] | SectionedList["extensions"] | SectionedList["routes"] | SectionedList["quicklinks"];
  focusedId: string;
  refs: Record<string, RefObject<HTMLLIElement | null>>;
  setFocusedId: (id: string) => void;
  showLaunchKeys: boolean;
};

export function Section({
  sectionKey,
  list,
  focusedId,
  refs,
  setFocusedId,
  showLaunchKeys,
}: SectionProps) {
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
