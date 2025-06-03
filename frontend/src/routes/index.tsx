import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createFileRoute } from "@tanstack/react-router";
import { useGlobalSlashFocus } from "@/hooks/useGlobalSlashFocus";
import { Footer } from "./-components/footer";
import { HelpDialog } from "./-components/help_dialog";
import { Section } from "./-components/section";
import { useSectionedList } from "@/hooks/useSectionedlist";
import { useRefsForKeys } from "@/hooks/useRefsForKeys";
import { useDesktopData } from "@/hooks/useDesktopData";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useSelectedListItem } from "@/hooks/useSelectedListItem";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [focusedId, setFocusedId] = useState("");
  const [showLaunchKeys, setShowLaunchKeys] = useState(false);

  const { apps, extensions, routes, quicklinks } = useDesktopData();

  const sectionedListItems = useSectionedList(
    search,
    apps,
    extensions,
    routes,
    quicklinks,
  );
  const refs = useRefsForKeys<HTMLLIElement>(sectionedListItems.flatUids);
  const focusedItem = useMemo(
    () =>
      sectionedListItems.apps.find((a) => a._uid === focusedId) ||
      sectionedListItems.extensions.find((e) => e._uid === focusedId) ||
      sectionedListItems.routes.find((r) => r._uid === focusedId) ||
      sectionedListItems.quicklinks.find((q) => q._uid === focusedId),
    [focusedId, sectionedListItems],
  );

  useGlobalSlashFocus(inputRef);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useKeyboardNav({
    flatUids: sectionedListItems.flatUids,
    focusedId,
    setFocusedId,
    refs,
    handleSubmit,
    toggleHelp: () => setIsHelpDialogOpen((prev) => !prev),
    setShowLaunchKeys,
  });

  const handler = useSelectedListItem();

  function handleSubmit() {
    if (focusedItem) {
      handler({
        search,
        setSearch,
        focusedItem,
      });
    }
  }

  return (
    <main>
      <HelpDialog isOpen={isHelpDialogOpen} setIsOpen={setIsHelpDialogOpen} />
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
      <ScrollArea className="h-[515px] pb-1.5">
        <ul className="flex h-full w-full flex-col overflow-hidden">
          {Object.entries(sectionedListItems).map(([key, list]) => {
            if(key === "flatUids") return null;
            if (search.startsWith(":") && key !== "quicklinks") return;
            return (
              <Section
                key={key}
                sectionKey={key}
                //@ts-ignore
                list={list}
                focusedId={focusedId}
                refs={refs}
                handleSubmit={handleSubmit}
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
