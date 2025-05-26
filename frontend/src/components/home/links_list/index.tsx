import type { Dispatch, RefObject, SetStateAction } from "react";
import { FocusableLink } from "../focusable_link";

type LinksListProps = {
  ref: RefObject<HTMLLIElement | null>[]
  routes: {
    path: string;
    label: string;
  }[];
  search: string;
  setSearch: Dispatch<SetStateAction<string>>
};

export function LinksList({ ref, routes, search }: LinksListProps) {
  const filteredRoutes = Object.values(routes).filter((route) => {
    const name = route.label.toLowerCase();
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm);
  });

  return filteredRoutes.map((route, idx) => (
    <li
      key={route.path}
      ref={el => {
        if (el && ref[idx]) {
          ref[idx].current = el;
        }
      }}
    >
      <FocusableLink
        path={route.path}
        label={route.label}
      />
    </li>
  ));
}
