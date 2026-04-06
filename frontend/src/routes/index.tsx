import { DesktopApps } from "bindings/github.com/vinewz/clutch/services/desktopApps";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({ component: App });

type App = {
  path: string;
  name: string;
  iconPath: string;
  keywords?: string[];
};

function App() {
  const [apps, setApps] = useState<App[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const res = await DesktopApps.GetAll();
      setApps(res);
    })();
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchQuery("");
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredApps = apps.filter((app) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = app.name.toLowerCase().includes(query);
    const keywordMatch = app.keywords?.some((k) =>
      k.toLowerCase().includes(query),
    );
    return nameMatch || keywordMatch;
  });

  return (
    <div className="h-screen flex flex-col">
      <div className="sticky top-0 z-10 p-4 border-b border-border bg-background/95 backdrop-blur">
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex-1 overflow-auto">
        {filteredApps.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No apps found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredApps.map((app) => (
              <div
                key={app.path}
                className="flex items-center gap-4 p-4 hover:bg-accent transition-colors"
              >
                <img
                  width={28}
                  height={28}
                  className="rounded-md object-contain"
                  src={`/files/icon?path=${encodeURIComponent(app.iconPath)}`}
                  alt={app.name}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="font-medium truncate">{app.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

