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
}
export function useNavigateList({ inputRef, liRefs, selectedId, setSelectedId, setSearch, setIsHelpDialogOpen, setShowLaunchKeys, flatList }: useNavigateListProps) {
  const actionHandler = useAction();
  function keyDown(e: KeyboardEvent) {
    switch (true) {
      case e.key === "ArrowDown": {
        e.preventDefault();
        setSelectedId((prev) => {
          const flatUids = flatList.map((item) => item._uid);
          const prevIdx = flatUids.findIndex((item) => item === prev) + 1;
          const nextId = flatUids[prevIdx < flatUids.length ? prevIdx : 0] || flatUids[0];
          liRefs.current[nextId].scrollIntoView({ block: "nearest" });
          return nextId;
        });
        break
      }
      case e.key === "ArrowUp": {
        e.preventDefault();
        setSelectedId((prev) => {
          const flatUids = flatList.map((item) => item._uid);
          const prevIdx = flatUids.findIndex((item) => item === prev) - 1;
          const nextId = flatUids[prevIdx >= 0 ? prevIdx : flatUids.length - 1] || flatUids[flatUids.length - 1];
          liRefs.current[nextId].scrollIntoView({ block: "nearest" });
          return nextId;
        });
        break
      }
      case e.key === "/": {
        e.preventDefault();
        if (inputRef?.current) {
          inputRef.current.value = "";
          inputRef.current.focus();
        }
        break
      }
      case e.key === "Enter": {
        e.preventDefault();
        const selectedItem = flatList.find((item) => item._uid === selectedId);
        if (selectedItem) {
          actionHandler({
            action: selectedItem._section.toLowerCase(),
            listItem: selectedItem,
          });
        }
        setSearch("");
        break
      }
      case e.key === "F1": {
        e.preventDefault()
        setIsHelpDialogOpen((prev) => !prev);
        break
      }
      case e.key === "Escape": {
        ClutchServices.ToggleApp()
        setSearch("");
        break
      }
      case e.key === "Control": {
        setShowLaunchKeys(true);
        break
      }
      case e.ctrlKey && /^[1-9]$/.test(e.key):
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        const appItem = flatList.find((item) => item._section === "Apps" && item._uid === flatList[index]?._uid);
        if (appItem) {
          actionHandler({
            action: "apps",
            listItem: appItem,
          });
        }
        break;
    }
  }

  function keyUp(e: KeyboardEvent) {
    if (e.key === "Control") {
      setShowLaunchKeys(false);
    }
  }

  return { keyDown, keyUp };
}
