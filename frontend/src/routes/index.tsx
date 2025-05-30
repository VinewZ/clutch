import type { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { createFileRoute, useNavigate, type UseNavigateResult } from "@tanstack/react-router";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import { useGlobalSlashFocus } from "@/hooks/useGlobalSlashFocus";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/home/footer";
import { useDesktopApps } from "@/hooks/useDesktopApps";
import { useDesktopExtensions } from "@/hooks/useExtensions";
import { ClutchPkgJson, ClutchServices, DesktopApp } from "../../bindings/github.com/vinewz/clutch/app";
import type { Quicklink } from "./settings/quicklinks";
import { useLocalStorage } from "@uidotdev/usehooks";
import { Section } from "@/components/home/section";

type SectionedT = {
  _section: string;
  _uid: string;
}

type AppsT = SectionedT & DesktopApp
type RoutesT = SectionedT & Route
type ExtensionsT = SectionedT & ClutchPkgJson
type QuickLinksT = SectionedT & Quicklink

type Route = {
  path: string;
  label: string;
}

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [focusedId, setFocusedId] = useState('');

  const { data: apps } = useDesktopApps()
  const { data: extensions } = useDesktopExtensions()
  const routes: Route[] = [{ path: "/settings/general", label: "Settings", }];
  const [quicklinks] = useLocalStorage<QuickLinksT[]>("quickLinks", [])

  const sectioned = useMemo(() => {
    const filterBy = (label: string) =>
      label.toLowerCase().includes(search.toLowerCase());

    if (!apps || !extensions || !routes || !quicklinks) {
      return { apps: [], extensions: [], routes: [], quicklinks: [] };
    }

    const filteredApps: AppsT[] = apps
      .filter((a) => filterBy(a.name))
      .map((a) => ({ ...a, _section: 'Apps', _uid: `apps-${a.name}` }));
    const filteredExtensions: ExtensionsT[] = extensions
      .filter((e) => filterBy(e.clutch.name))
      .map((e) => ({ ...e, _section: 'Extensions', _uid: `ext-${e.clutch.name}` }));
    const filteredRoutes: RoutesT[] = routes
      .filter((r) => filterBy(r.label))
      .map((r) => ({ ...r, _section: 'Routes', _uid: `route-${r.label}` }));
    const filteredQuickLinks: QuickLinksT[] = quicklinks
      .filter((q) => filterBy(q.command))
      .map((q) => ({ ...q, _section: 'Quicklinks', _uid: `quicklink-${q.command}` }));

    const result = {
      apps: filteredApps,
      extensions: filteredExtensions,
      routes: filteredRoutes,
      quicklinks: filteredQuickLinks,
    }
    return result;
  }, [search, apps, extensions, routes, quicklinks]);

  const flatOrder = useMemo(
    () => [
      ...sectioned.apps,
      ...sectioned.extensions,
      ...sectioned.routes,
      ...sectioned.quicklinks
    ].map((it) => it._uid),
    [sectioned]
  );

  const refs = useRef({});
  flatOrder.forEach((id) => {
    if (!refs.current[id]) refs.current[id] = createRef();
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!flatOrder.length) return;
      let idx = flatOrder.indexOf(focusedId);
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const next = flatOrder[(idx + 1 + flatOrder.length) % flatOrder.length];
          setFocusedId(next);
          refs.current[next].current?.scrollIntoView({ block: 'nearest' });
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prev = flatOrder[(idx - 1 + flatOrder.length) % flatOrder.length];
          setFocusedId(prev);
          refs.current[prev].current?.scrollIntoView({ block: 'nearest' });
          break;
        case 'Escape':
          ClutchServices.ToggleApp()
          break
        case 'Enter':
          handleSubmit();
          break;
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    }
  }, [focusedId, flatOrder]);

  useGlobalSlashFocus(inputRef);

  useEffect(() => {
    inputRef.current?.focus();
  }, [])

  function handleSubmit() {
    const focusedItem = sectioned.apps.find((a) => a._uid === focusedId) ||
      sectioned.extensions.find((e) => e._uid === focusedId) ||
      sectioned.routes.find((r) => r._uid === focusedId);
    if (focusedItem) {
      switch (focusedItem._section) {
        case "Apps":
          handleApp(focusedItem as AppsT);
          break
        case "Extensions":
          handleExtensions(navigate, focusedItem as ExtensionsT);
          break
        case "Routes":
          handleRoutes(navigate, focusedItem as RoutesT);
          break
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
          setSearch(e.target.value)
          setFocusedId(flatOrder[0] || '');
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
          {Object.entries(sectioned).map(([key, list]) => (
            <Section
              key={key}
              sectionKey={key}
              list={list}
              focusedId={focusedId}
              refs={refs}
              handleSubmit={handleSubmit}
              setFocusedId={setFocusedId}
            />
          ))}
        </ul>
      </ScrollArea>
      <Footer />
    </main >
  );
}

function handleApp(app: AppsT) {
  ClutchServices.ExecApp(app)
  ClutchServices.ToggleApp()
}

function handleExtensions(navigate: UseNavigateResult<string>, extension: ExtensionsT) {
  navigate({
    to: '/extension/$extension',
    params: { extension: extension.clutch.repo },
  });
}

function handleRoutes(navigate: UseNavigateResult<string>, routes: RoutesT) {
  navigate({
    to: routes.path,
  });
}
