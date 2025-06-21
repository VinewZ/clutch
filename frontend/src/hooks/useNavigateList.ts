import type { Dispatch, RefObject, SetStateAction } from "react";
import type { SectionedList } from "./useSectionedlist";
import { useAction } from "./useAction";
import { ClutchServices } from "../../bindings/github.com/vinewz/clutch/app/";

type useNavigateListProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  liRefs: RefObject<HTMLLIElement[]>;
  selectedId: string;
  setSelectedId: Dispatch<SetStateAction<string>>;
  setSearch: Dispatch<SetStateAction<string>>;
  setShowLaunchKeys: Dispatch<SetStateAction<boolean>>;
  setIsHelpDialogOpen: Dispatch<SetStateAction<boolean>>;
  flatList: SectionedList["flatList"];
};

export function useNavigateList({
  inputRef,
  liRefs,
  selectedId,
  setSelectedId,
  setSearch,
  setIsHelpDialogOpen,
  setShowLaunchKeys,
  flatList,
}: useNavigateListProps) {
  const actionHandler = useAction();

  function keyDown(e: KeyboardEvent) {
    switch (true) {
      case e.key === "ArrowDown": {
        e.preventDefault();
        setSelectedId((prev) => {
          const flatUids = flatList.map((item) => item._uid);
          const idx = flatUids.indexOf(prev);
          const nextIdx = idx < flatUids.length - 1 ? idx + 1 : 0;
          const nextId = flatUids[nextIdx];
          liRefs.current[nextId].scrollIntoView({ block: "nearest" });
          return nextId;
        });
        break;
      }

      case e.key === "ArrowUp": {
        e.preventDefault();
        setSelectedId((prev) => {
          const flatUids = flatList.map((item) => item._uid);
          const idx = flatUids.indexOf(prev);
          const prevIdx = idx > 0 ? idx - 1 : flatUids.length - 1;
          const nextId = flatUids[prevIdx];
          liRefs.current[nextId].scrollIntoView({ block: "nearest" });
          return nextId;
        });
        break;
      }

      case e.key === "/": {
        e.preventDefault(); // always prevent default browser find / char behavior
        const inputEl = inputRef.current;
        if (!inputEl) break;

        if (document.activeElement !== inputEl) {
          // if not focused, just focus
          inputEl.focus();
        } else {
          // if already focused, insert slash at cursor
          const { selectionStart, selectionEnd, value } = inputEl;
          const start = selectionStart ?? value.length;
          const end = selectionEnd ?? value.length;
          const before = value.slice(0, start);
          const after = value.slice(end);
          const newVal = before + "/" + after;
          setSearch(newVal);
          // move cursor just after inserted slash
          setTimeout(() => {
            inputEl.setSelectionRange(start + 1, start + 1);
          }, 0);
        }
        break;
      }

      case e.key === "Enter": {
        e.preventDefault();
        const selectedItem = flatList.find((item) => item._uid === selectedId);
        if (selectedItem) {
          actionHandler({
            listItem: selectedItem,
            input: inputRef.current?.value
          });
        }
        setSearch("");
        break;
      }

      case e.key === "F1": {
        e.preventDefault();
        setIsHelpDialogOpen((prev) => !prev);
        break;
      }

      case e.key === "Escape": {
        ClutchServices.ToggleApp();
        setSearch("");
        break;
      }

      case e.key === "Control": {
        setShowLaunchKeys(true);
        break;
      }

      case e.ctrlKey && /^[1-9]$/.test(e.key): {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        const appItem = flatList.find(
          (item, i) => item._section === "Apps" && i === index
        );
        if (appItem) {
          actionHandler({
            listItem: appItem,
          });
        }
        break;
      }
    }
  }

  function keyUp(e: KeyboardEvent) {
    if (e.key === "Control") {
      setShowLaunchKeys(false);
    }
  }

  return { keyDown, keyUp };
}
