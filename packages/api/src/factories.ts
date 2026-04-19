import type { ElementType, ReactNode } from "react";
import { jsx } from "react/jsx-runtime";

type ComponentWithSubcomponents = {
	(props: { children?: ReactNode }): ReturnType<typeof jsx>;
	displayName: string;
	[key: string]: unknown;
};

export function createComponent(type: string): ComponentWithSubcomponents {
	const Component = (props: { children?: ReactNode }) =>
		jsx(type as ElementType, props);
	Component.displayName = type;
	return Component as ComponentWithSubcomponents;
}

export function createSlottedComponent<P extends string>(
	type: string,
	slotProps: readonly P[],
): ComponentWithSubcomponents {
	const Slot = createComponent("Slot");
	const Component = (props: Record<string, unknown>) => {
		const { children, ...rest } = props;
		const slots = slotProps
			.filter((prop) => rest[prop])
			.map((prop) => Slot({ children: rest[prop] as ReactNode }));
		for (const prop of slotProps) delete rest[prop];
		return jsx(type as ElementType, {
			...rest,
			children: [children as ReactNode, ...slots].filter(Boolean),
		});
	};
	Component.displayName = type;
	return Component as ComponentWithSubcomponents;
}
