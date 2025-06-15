import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FormEvent } from "react";

type MainInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string
  className?: string
}

export function MainInput({
  inputRef,
  value,
  setValue,
  placeholder,
  className
}: MainInputProps) {

  return (
    <Input
      ref={inputRef}
      className={cn(
        "h-[50px] rounded-none border-0 border-b fixed top-0 left-0 right-0 bg-zinc-800! z-50",
        className
      )} value={value}
      placeholder={placeholder ? placeholder : `Type "/" to search...`}
      onChange={(e) => {
        setValue(e.target.value);
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
