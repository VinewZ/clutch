import type { FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import { useGlobalSlashFocus } from "@/hooks/useGlobalSlashFocus";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/home/footer";
import { useDesktopApps } from "@/hooks/useDesktopApps";
import { useDesktopExtensions } from "@/hooks/useExtensions";
import { cn } from "@/lib/utils";
import { ClutchServices } from "../../bindings/github.com/vinewz/clutch/app";

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

  const sectioned = useMemo(() => {
    const filterBy = (label: string) =>
      label.toLowerCase().includes(search.toLowerCase());

    if (!apps || !extensions || !routes) {
      return { apps: [], extensions: [], routes: [] };
    }
    const filteredApps = apps
      .filter((a) => filterBy(a.name))
      .map((a) => ({ ...a, _section: 'Apps', _uid: `apps-${a.name}` }));
    const filteredExtensions = extensions
      .filter((e) => filterBy(e.clutch.name))
      .map((e) => ({ ...e, _section: 'Extensions', _uid: `ext-${e.clutch.name}` }));
    const filteredRoutes = routes
      .filter((r) => filterBy(r.label))
      .map((r) => ({ ...r, _section: 'Routes', _uid: `route-${r.label}` }));

    const result = { apps: filteredApps, extensions: filteredExtensions, routes: filteredRoutes }
    return result;
  }, [search, apps, extensions, routes]);

  const flatOrder = useMemo(
    () => [
      ...sectioned.apps,
      ...sectioned.extensions,
      ...sectioned.routes,
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
        case 'Enter':
          handleLaunch();
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

  function handleLaunch() {
    const focusedItem = sectioned.apps.find((a) => a._uid === focusedId) ||
      sectioned.extensions.find((e) => e._uid === focusedId) ||
      sectioned.routes.find((r) => r._uid === focusedId);
    if (focusedItem) {
      if (focusedItem._section === 'Apps') {
        // @ts-ignore
        ClutchServices.ExecApp(focusedItem);
        ClutchServices.ToggleApp();
      } else if (focusedItem._section === 'Extensions') {
        navigate({
          to: '/extension/$extension',
          // @ts-ignore
          params: { extension: focusedItem.clutch.repo },
        });
      } else if (focusedItem._section === 'Routes') {
        navigate({
          // @ts-ignore
          to: focusedItem.path,
        });
      }
      setSearch("");
    }
  }

  return (
    <div>
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
          {['apps', 'extensions', 'routes'].map((sectionKey) => {
            const list = sectioned[sectionKey];
            return (
              <div key={sectionKey}>
                <p className="text-xs px-2 my-1.5 text-zinc-400 capitalize">
                  {sectionKey}
                </p>
                <ul>
                  {list.map((item) => {
                    const label = item.name || item.label || item.clutch?.name
                    const isFocused = item._uid === focusedId;
                    return (
                      <li
                        key={item._uid}
                        id={item._uid}
                        ref={refs.current[item._uid]}
                        onClick={() => {
                          setFocusedId(item._uid);
                          handleLaunch();
                        }}
                        className={cn(
                          "mx-1 flex items-center gap-2 rounded p-2 text-sm cursor-pointer",
                          isFocused ? "bg-zinc-700" : "text-zinc-300",
                        )}
                        onMouseEnter={() => setFocusedId(item._uid)}
                        onMouseLeave={() => setFocusedId('')}
                      >
                        {label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </ul>
      </ScrollArea>
      <Footer />
    </div >
  );
}
