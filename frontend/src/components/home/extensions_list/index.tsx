import { Link } from "@tanstack/react-router";
import type { ClutchPkgJson } from "bindings/github.com/vinewz/clutch/app";
import type { Dispatch, RefObject, SetStateAction } from "react";

type ExtensionsListProps = {
	ref: RefObject<HTMLLIElement | null>[];
	extensions: ClutchPkgJson[];
	search: string;
	setSearch: Dispatch<SetStateAction<string>>;
};

export function ExtensionsList({ ref, extensions }: ExtensionsListProps) {
	return extensions.map((ext, idx) => (
		<li
			ref={(el) => {
				if (el && ref[idx]) {
					ref[idx].current = el;
				}
			}}
			key={ext.clutch.repo}
		>
			<Link
				to="/extension/$extension"
				params={{ extension: ext.clutch.repo }}
				className="mx-1 flex items-center gap-2 rounded p-2 font-medium text-sm "
			>
				{ext.clutch.name}
			</Link>
		</li>
	));
}
