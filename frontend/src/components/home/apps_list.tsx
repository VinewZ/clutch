import type { Dispatch, SetStateAction } from "react";
import type { DesktopApp } from "../../../bindings/github.com/vinewz/clutch/app/models";
import { FocusableLi } from "./focusable_li";

type AppsListProps = {
  apps: DesktopApp[];
  search: string;
  setSearch: Dispatch<SetStateAction<string>>
};

export function AppsList({ apps, search, setSearch }: AppsListProps) {
  const filteredApps = Object.values(apps).filter((app) => {
    const name = app.name.toLowerCase();
    const searchTerm = search.toLowerCase();
    return (
      name.includes(searchTerm) ||
      app.keywords.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <ul className="overflow-y-auto py-2">
      {filteredApps.map((app) => {
        // let id = "app";
        // if (idx === 0) {
        //   id = "clutch-app-list-first-element";
        // } if (idx === filteredApps.length - 1) {
        //   id = "clutch-app-list-last-element";
        // }
        return (
          <FocusableLi /* id={id} */ key={app.id} app={app} setSearch={setSearch} />
        )
      })}
    </ul>
  );
}
