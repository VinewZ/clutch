import { Item } from "@/components/home/item";

type SectionProps<T> = {
  sectionKey: string;
  list: T[];
  focusedId: string;
  refs: React.RefObject<Record<string, React.RefObject<HTMLLIElement>>>;
  handleSubmit: () => void;
  setFocusedId: (id: string) => void;
}

export function Section<T extends { _uid: string }>(props: SectionProps<T>) {
  const { sectionKey, list, focusedId, refs, handleSubmit, setFocusedId } = props;
  return (
    <li>
      <p className="text-xs px-2 my-1.5 text-zinc-400 capitalize">
        {sectionKey}
      </p>
      <ul>
        {list.map(item => (
          <Item
            key={item._uid}
            item={item}
            isFocused={item._uid === focusedId}
            ref={refs.current[item._uid]}
            handleSubmit={handleSubmit}
            setFocusedId={setFocusedId}
          />
        ))}
      </ul>
    </li>
  );
}
