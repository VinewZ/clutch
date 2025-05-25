import { Link } from "@tanstack/react-router";
import type { ClutchPkgJson } from "bindings/github.com/vinewz/clutch/app";

type ExtensionsListProps = {
  extensions: ClutchPkgJson[];
}

export function ExtensionsList({ extensions }: ExtensionsListProps) {
  return (
    extensions.map(ext => (
      <li key={ext.clutch.repo}>
        <Link
          to="/extension/$extension"
          params={{ extension: ext.clutch.repo }}
          className="mx-1 flex items-center gap-2 rounded p-2 text-sm font-medium "
        >
          {
            ext.clutch.name
          }
        </Link>
      </li>
    ))
  );
}
