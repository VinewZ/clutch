import type { FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGlobalSlashFocus } from "@/hooks/useGlobalSlashFocus";

import { ClutchServices } from "../../bindings/github.com/vinewz/clutch/app/index";
import { LinksList } from "@/components/home/links_list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/home/footer";
import { AppsList } from "@/components/home/app_list";
import { useDesktopApps } from "@/hooks/useDesktopApps";
import { useDesktopExtensions } from "@/hooks/useExtensions";
import { ExtensionsList } from "@/components/home/extensions_list";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const focusableRef = useRef<HTMLElement>(null)
  // callback ref that *accepts* whatever element React gives us…
  const assignRef = useCallback((node: HTMLElement | null) => {
    focusableRef.current = node;
  }, []);
  const [search, setSearch] = useState("");
  const [focusIdx, setFocusIdx] = useState(1)

  const { data: apps } = useDesktopApps()
  const { data: extensions } = useDesktopExtensions()

  useGlobalSlashFocus(inputRef);
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          ClutchServices.ToggleApp();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusIdx(prev => {
            const focusableElements = apps && extensions ? apps.length + extensions.length : 0
            console.log("focusableElements", focusableElements, "prev", prev);
            if (prev >= focusableElements) return 1;
            return prev + 1;
          })
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIdx(prev => {
            const focusableElements = apps && extensions ? apps.length + extensions.length : 0
            console.log("focusableElements", focusableElements, "prev", prev);
            if (prev >= focusableElements) return 1;
            if (prev <= 1) return focusableElements;
            if (focusableElements === 0) return 1;
            return prev - 1;
          })
          break;
        default:
          break
      }
    }

    inputRef.current?.addEventListener("keydown", handleKeyDown);
    return () => {
      inputRef.current?.removeEventListener("keydown", handleKeyDown);
    };
  }, [apps, extensions]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          console.log(focusableRef.current);
        }}
      >
        <Input
          ref={inputRef}
          className="h-[50px] rounded-none border-0 border-b"
          value={search}
          placeholder={`Type "/" to search...`}
          onChange={(e) => setSearch(e.target.value)}
          onBeforeInput={(e: FormEvent<HTMLInputElement>) => {
            const native = e.nativeEvent as InputEvent;
            if (native.data === "/") {
              native.preventDefault();
            }
          }}
        />
        <button type="submit" className="hidden">
          onSubmit
        </button>
      </form>
      <code>
        {focusIdx}
      </code>
      <ScrollArea className="h-[515px] pb-1.5">
        <ul>
          {
            apps && apps.length > 0 && (
              <>
                <span className="m-2 mb-0 block text-sm font-medium text-zinc-400">
                  Apps
                </span>
                <AppsList
                  ref={assignRef}
                  currentIdx={focusIdx}
                  apps={apps}
                  search={search}
                  setSearch={setSearch}
                />
              </>
            )
          }
          {
            extensions && extensions.length > 0 && (
              <>
                <span className="m-2 mb-0 block text-sm font-medium text-zinc-400">
                  Extensions
                </span>
                <ExtensionsList extensions={extensions} />
              </>
            )
          }
          <span className="m-2 mb-0 block text-sm font-medium text-zinc-400">
            Cmds
          </span>
          <LinksList ref={assignRef} currentIdx={focusIdx} search={search} />
        </ul>
      </ScrollArea>
      <Footer />
    </div >
  );
}
