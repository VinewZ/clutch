import type { FormEvent } from "react";
import type { Quicklink } from "./settings/quicklinks";
import type { ListRoute } from "@/hooks/useSectionelist";
import { Input } from "@/components/ui/input";
import {
  createFileRoute,
  useNavigate,
  type UseNavigateResult,
} from "@tanstack/react-router";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import { useGlobalSlashFocus } from "@/hooks/useGlobalSlashFocus";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/home/footer";
import { useDesktopApps } from "@/hooks/useDesktopApps";
import { useDesktopExtensions } from "@/hooks/useExtensions";
import {
  type ClutchPkgJson,
  ClutchServices,
  type DesktopApp,
} from "../../bindings/github.com/vinewz/clutch/app";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Section } from "@/components/home/section";
import { Browser } from "@wailsio/runtime";
import { useSectionedList } from "@/hooks/useSectionelist";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [focusedId, setFocusedId] = useState("");

  const { data: apps } = useDesktopApps();
  const { data: extensions } = useDesktopExtensions();
  const routes: ListRoute[] = [
    { path: "/settings/general", label: "Settings" },
  ];
  const [quicklinks] = useLocalStorage<Quicklink[]>("quickLinks", []);

  const sectioned = useSectionedList(
    search,
    apps,
    extensions,
    routes,
    quicklinks,
  );

  const flatOrder = useMemo(
    () =>
      (
        [
          sectioned.apps,
          sectioned.extensions,
          sectioned.routes,
          sectioned.quicklinks,
        ] as const
      ).flatMap((list) => list.map((it: { _uid: string }) => it._uid)),
    [sectioned],
  );

  const refs = useRef({});
  for (const id of flatOrder) {
    if (!refs.current[id]) {
      refs.current[id] = createRef<HTMLLIElement>();
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!flatOrder.length) return;
      const idx = flatOrder.indexOf(focusedId);
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next =
            flatOrder[(idx + 1 + flatOrder.length) % flatOrder.length];
          setFocusedId(next);
          refs.current[next].current?.scrollIntoView({ block: "nearest" });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev =
            flatOrder[(idx - 1 + flatOrder.length) % flatOrder.length];
          setFocusedId(prev);
          refs.current[prev].current?.scrollIntoView({ block: "nearest" });
          break;
        }
        case "Escape": {
          ClutchServices.ToggleApp();
          break;
        }
        case "Enter": {
          handleSubmit();
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [focusedId, flatOrder]);

  useGlobalSlashFocus(inputRef);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    const focusedItem =
      sectioned.apps.find((a) => a._uid === focusedId) ||
      sectioned.extensions.find((e) => e._uid === focusedId) ||
      sectioned.routes.find((r) => r._uid === focusedId) ||
      sectioned.quicklinks.find((r) => r._uid === focusedId);
    console.log(focusedItem);
    if (focusedItem) {
      switch (focusedItem._section) {
        case "Apps": {
          handleApp(focusedItem);
          break;
        }
        case "Extensions": {
          handleExtensions(focusedItem, navigate);
          break;
        }
        case "Routes": {
          handleRoutes(focusedItem, navigate);
          break;
        }
        case "Quicklinks": {
          const split = search.split(" ");
          const param = split.slice(1).join(" ");
          handleQuicklink(focusedItem, param);
          break;
        }
      }
      setSearch("");
    }
  }

  return (
    <main>
      <Input
        ref={inputRef}
        className="h-[50px] rounded-none border-0 border-b"
        value={search}
        placeholder={`Type "/" to search...`}
        onChange={(e) => {
          setSearch(e.target.value);
          setFocusedId(flatOrder[0] || "");
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
          {Object.entries(sectioned).map(([key, list]) => {
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
              />
            );
          })}
        </ul>
      </ScrollArea>
      <Footer />
    </main>
  );
}

function handleApp(app: DesktopApp) {
  ClutchServices.ExecApp(app);
  ClutchServices.ToggleApp();
}

function handleExtensions(
  extension: ClutchPkgJson,
  navigate: UseNavigateResult<string>,
) {
  navigate({
    to: "/extension/$extension",
    params: { extension: extension.clutch.repo },
  });
}

function handleRoutes(routes: ListRoute, navigate: UseNavigateResult<string>) {
  navigate({
    to: routes.path,
  });
}

function handleQuicklink(qLink: Quicklink, param: string) {
  try {
    Browser.OpenURL(`${qLink.link}${param}`);
  } catch (err) {
    console.log(err);
  }
  ClutchServices.ToggleApp();
}
