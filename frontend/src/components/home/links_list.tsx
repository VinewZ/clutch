import { FocusableLink } from "./focusable_link";

type LinksListProps = {
  search: string;
};

export function LinksList({ search }: LinksListProps) {
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

  return filteredRoutes.map((route) => (
    <FocusableLink key={route.path} path={route.path} label={route.label} />
  ));
}
