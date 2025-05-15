import { useEffect } from "react";
import type { RefObject } from "react";

export function useGlobalSlashFocus(
  inputRef: RefObject<HTMLInputElement | null>,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        if (inputRef?.current) {
          inputRef.current.value = "";
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inputRef]);
}
