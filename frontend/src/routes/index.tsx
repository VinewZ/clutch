import { Input } from "@/components/ui/input";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useGlobalSlashFocus } from "@/hooks/useGlobalSlashFocus";
import { ClutchServices } from "../../bindings/github.com/vinewz/clutch/app/index";
import type { DesktopApp } from "../../bindings/github.com/vinewz/clutch/app/models";
import { AppsList } from "@/components/home/apps_list";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState<DesktopApp[]>([]);
  const filteredApps = Object.values(apps).filter((app) => {
    const name = app.Name.toLowerCase();
    const searchTerm = search.toLowerCase();
    return (
      name.includes(searchTerm) ||
      app.Keywords.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  });
  useGlobalSlashFocus(inputRef);
  useEffect(() => {
    ClutchServices.GetDesktopApps().then((apps) => {
      // @ts-ignore
      setApps(apps);
    });
  }, []);

  return (
    <div className="App">
      <Input
        ref={inputRef}
        className="h-[50px] rounded-none border-0 border-b"
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
        <div className="max-h-[225px] overflow-y-auto">
          <span className="m-2 mb-0 block text-xs font-medium text-zinc-400">
            Apps
          </span>
          <AppsList apps={filteredApps} />
        </div>
        <div className="max-h-[225px] overflow-y-auto">
          <span className="m-2 block text-sm font-medium text-zinc-400">
            Cmds
          </span>
          <Link
            to="/settings/general"
            className={cn(
              "mx-1 flex items-center gap-2 rounded p-2 text-sm font-medium text-zinc-300",
            )}
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
