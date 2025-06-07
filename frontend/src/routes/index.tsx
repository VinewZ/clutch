import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "./-components/footer";
import { HelpDialog } from "./-components/help_dialog";
import { useSectionedList } from "@/hooks/useSectionedlist";
import { MainInput } from "./-components/main_input";
import { Section } from "./-components/section";
import { useNavigateList } from "@/hooks/useNavigateList";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [showLaunchKeys, setShowLaunchKeys] = useState(false);
  const sectionedListItems = useSectionedList({ search });

  const liRefs = useRef<HTMLLIElement[]>([])
  const [selectedId, setSelectedId] = useState("");
  const keyHandlers = useNavigateList({
    inputRef,
    liRefs,
    selectedId,
    setSelectedId,
    setSearch,
    setShowLaunchKeys,
    setIsHelpDialogOpen,
    flatList: sectionedListItems.flatList
  })

  useEffect(() => {
    window.addEventListener("keydown", keyHandlers.keyDown);
    window.addEventListener("keyup", keyHandlers.keyUp);
    return () => {
      window.removeEventListener("keydown", keyHandlers.keyDown);
      window.removeEventListener("keyup", keyHandlers.keyUp);
    };
  }, [sectionedListItems])

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedId(sectionedListItems.flatList[0]._uid || "");
  }, [search]);

  return (
    <main>
      <HelpDialog isOpen={isHelpDialogOpen} setIsOpen={setIsHelpDialogOpen} />
      <MainInput
        inputRef={inputRef}
        search={search}
        setSearch={setSearch}
      />
      <ScrollArea className="h-[515px] pb-1.5 mt-[50px]">
        <ul className="flex h-full w-full flex-col overflow-hidden">
          {Object.entries(sectionedListItems).map(([key, list]) => {
            if (key === "flatList") return
            if (search.startsWith(":") && key !== "quicklinks") return;
            return (
              <Section
                key={key}
                sectionKey={key}
                liRefs={liRefs}
                setSelectedId={setSelectedId}
                selectedId={selectedId}
                list={list}
                showLaunchKeys={showLaunchKeys}
              />
            )
          })}
        </ul>
      </ScrollArea>
      <Footer />
    </main>
  );
}
