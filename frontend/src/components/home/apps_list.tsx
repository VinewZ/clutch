import type { DesktopApp } from "../../../bindings/github.com/vinewz/clutch/app/models";
import { FocusableLi } from "./focusable_li";

type AppsListProps = {
  apps: DesktopApp[];
  search: string;
};

export function AppsList({ apps, search }: AppsListProps) {
  const filteredApps = Object.values(apps).filter((app) => {
    const name = app.name.toLowerCase();
    const exec = app.exec.toLowerCase();
    const searchTerm = search.toLowerCase();
    return (
      name.includes(searchTerm) ||
      exec.includes(searchTerm) ||
      app.keywords.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <ul className="overflow-y-auto py-2">
      {filteredApps.map((app) => (
        <FocusableLi key={app.id} app={app} />
      ))}
    </ul>
  );
}
