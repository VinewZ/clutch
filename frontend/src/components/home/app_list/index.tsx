import type { Dispatch, Ref, SetStateAction } from "react";
import type { DesktopApp } from "../../../../bindings/github.com/vinewz/clutch/app/models";
import { FocusableLi } from "../focusable_li";

type AppsListProps = {
  apps: DesktopApp[];
  ref: Ref<HTMLLIElement> | undefined;
  currentIdx: number;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>
};

export function AppsList({ apps, search, ref, currentIdx, setSearch }: AppsListProps) {
  const filteredApps = Object.values(apps).filter((app) => {
    const name = app.name.toLowerCase();
    const searchTerm = search.toLowerCase();
    return (
      name.includes(searchTerm) ||
      app.keywords.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  });

  return (
    filteredApps.map((app, idx) => (
      <FocusableLi
        key={app.id}
        ref={idx + 1 === currentIdx ? ref : null}
        focused={idx + 1 === currentIdx}
        app={app}
        setSearch={setSearch}
      />
    ))
  );
}
