import { Input } from "@/components/ui/input";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useGlobalSlashFocus } from "@/hooks/useGlobalSlashFocus";
import { AppsList } from "@/components/home/apps_list";

import { RovingTabIndexProvider, useFocusEffect } from "react-roving-tabindex";

import { ClutchServices } from "../../bindings/github.com/vinewz/clutch/app/index";
import type { DesktopApp } from "../../bindings/github.com/vinewz/clutch/app/models";
import { LinksList } from "@/components/home/links_list";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState<DesktopApp[]>([]);
  useGlobalSlashFocus(inputRef);
  useEffect(() => {
    ClutchServices.GetDesktopApps().then((apps) => {
      // @ts-ignore
      setApps(apps);
    });

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          ClutchServices.ToggleApp();
          break;
        case "ArrowDown":
          e.preventDefault();
          // const firstElement = document.querySelector("#clutch-app-list-first-element");
          // if (firstElement) {
          //   (firstElement as HTMLLIElement).focus();
          // }
          // @ts-ignore
          useFocusEffect(focused, ref);
          break;
        case "ArrowUp":
          e.preventDefault();
          // const lastElement = document.querySelector("#clutch-app-list-last-element");
          // if (lastElement) {
          //   (lastElement as HTMLLIElement).focus();
          // }
          break;
        default:
          break
      }

    }


    inputRef.current?.focus();

    inputRef.current?.addEventListener("keydown", handleKeyDown);
    return () => {
      inputRef.current?.removeEventListener("keydown", handleKeyDown);
    };

  }, []);


  return (
    <div className="App">
      <Input
        ref={inputRef}
        className="h-[50px] rounded-none border-0 border-b"
        value={search}
        placeholder={`Type "/" to search...`}
        onChange={(e) => setSearch(e.target.value)}
        onBeforeInput={(e: React.FormEvent<HTMLInputElement>) => {
          const native = e.nativeEvent as InputEvent;
          if (native.data === "/") {
            native.preventDefault();
          }
        }}
      />
      <div className="h-[550px]">
        <RovingTabIndexProvider
          options={{
            direction: "vertical",
            focusOnClick: true,
            loopAround: true
          }}
        >
          <div className="overflow-y-auto">
            <span className="m-2 mb-0 block text-sm font-medium text-zinc-400">
              Apps
            </span>
            <AppsList apps={apps} search={search} setSearch={setSearch} />
          </div>
          <div className="overflow-y-auto pb-1.5">
            <span className="m-2 mb-0 block text-sm font-medium text-zinc-400">
              Extensions
            </span>
            <Link
              to="/extension/$extension"
              params={{ extension: "name" }}
              className="mx-1 flex items-center gap-2 rounded p-2 text-sm font-medium "
            >
              ext
            </Link>
          </div>
          <div className="overflow-y-auto pb-2">
            <span className="m-2 mb-0 block text-sm font-medium text-zinc-400">
              Cmds
            </span>
            <LinksList search={search} />
          </div>
        </RovingTabIndexProvider>
      </div>
    </div>
  );
}
