import { Input } from "@/components/ui/input";
import type { FormEvent } from "react";

type MainInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  search: string;
  setSearch: (value: string) => void;
}

export function MainInput({
  inputRef,
  search,
  setSearch,
}: MainInputProps) {

  return (
    <Input
      ref={inputRef}
      className="h-[50px] rounded-none border-0 border-b fixed top-0 left-0 right-0 bg-zinc-800! z-50"
      value={search}
      placeholder={`Type "/" to search...`}
      onChange={(e) => {
        setSearch(e.target.value);
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
