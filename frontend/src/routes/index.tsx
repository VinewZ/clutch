import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createFileRoute } from "@tanstack/react-router";
import { useGlobalSlashFocus } from "@/hooks/useGlobalSlashFocus";
import { Footer } from "./-components/footer";
import { HelpDialog } from "./-components/help_dialog";
import { Section } from "./-components/section";
import { useSectionedList } from "@/hooks/useSectionedlist";
import { useRefsForKeys } from "@/hooks/useRefsForKeys";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { MainInput } from "./-components/main_input";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [focusedId, setFocusedId] = useState("");
  const [showLaunchKeys, setShowLaunchKeys] = useState(false);

  const sectionedListItems = useSectionedList({ search });
  const refs = useRefsForKeys<HTMLLIElement>(sectionedListItems.flatUids);

  useGlobalSlashFocus(inputRef);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useKeyboardNav({
    flatUids: sectionedListItems.flatUids,
    focusedId,
    setFocusedId,
    refs,
    toggleHelp: () => setIsHelpDialogOpen((prev) => !prev),
    setShowLaunchKeys,
  });


  return (
    <main>
      <HelpDialog isOpen={isHelpDialogOpen} setIsOpen={setIsHelpDialogOpen} />
      <MainInput
        inputRef={inputRef}
        search={search}
        setSearch={setSearch}
        setFocusedId={setFocusedId}
        sectionedListItems={sectionedListItems}
      />
      <ScrollArea className="h-[515px] pb-1.5">
        <ul className="flex h-full w-full flex-col overflow-hidden">
          {Object.entries(sectionedListItems).map(([key, list]) => {
            if (key === "flatUids") return null;
            if (search.startsWith(":") && key !== "quicklinks") return;
            return (
              <Section
                key={key}
                sectionKey={key}
                //@ts-ignore
                list={list}
                focusedId={focusedId}
                refs={refs}
                setFocusedId={setFocusedId}
                showLaunchKeys={showLaunchKeys}
              />
            );
          })}
        </ul>
      </ScrollArea>
      <Footer />
    </main>
  );
}
