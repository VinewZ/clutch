import { Input } from "@/components/ui/input";
import type { FormEvent } from "react";

type MainInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  search: string;
  setSearch: (value: string) => void;
  setFocusedId: (id: string) => void;
  sectionedListItems: {
    flatUids: string[];
  };
}

export function MainInput({
  inputRef,
  search,
  setSearch,
  setFocusedId,
  sectionedListItems,
}: MainInputProps) {

  return (
    <Input
      ref={inputRef}
      className="h-[50px] rounded-none border-0 border-b"
      value={search}
      placeholder={`Type "/" to search...`}
      onChange={(e) => {
        setSearch(e.target.value);
        setFocusedId(sectionedListItems.flatUids[0] || "");
      }}
      onBeforeInput={(e: FormEvent<HTMLInputElement>) => {
        const native = e.nativeEvent as InputEvent;
        if (native.data === "/") {
          native.preventDefault();
        }
      }}
    />

  )

}
