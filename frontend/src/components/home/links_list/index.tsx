import type { Ref } from "react";
import { FocusableLink } from "../focusable_link";

type LinksListProps = {
  ref: Ref<HTMLAnchorElement> | undefined;
  currentIdx: number;
  search: string;
};

export function LinksList({ search, ref, currentIdx }: LinksListProps) {
  const routes = [
    {
      path: "/settings/general",
      label: "Settings",
    },
  ];

  const filteredRoutes = Object.values(routes).filter((route) => {
    const name = route.label.toLowerCase();
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm);
  });

  return filteredRoutes.map((route, idx) => (
    <li
      key={route.path}
    >
      <FocusableLink
        ref={idx + 1 === currentIdx ? ref : null}
        focused={idx + 1 === currentIdx}
        path={route.path}
        label={route.label}
      />
    </li>
  ));
}
