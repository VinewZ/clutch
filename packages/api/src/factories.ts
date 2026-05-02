import { createElement, type ElementType, type ReactNode } from "react";
import { jsx } from "react/jsx-runtime";

type ComponentProps = { children?: ReactNode; name?: string };

type ComponentWithSubcomponents = {
	(props: ComponentProps): ReturnType<typeof jsx>;
	displayName: string;
	[key: string]: unknown;
};

export function createComponent(type: string): ComponentWithSubcomponents {
	const Component = (props: ComponentProps) => jsx(type as ElementType, props);
	Component.displayName = type;
	return Component as ComponentWithSubcomponents;
}

export function createBuiltinActionComponent(
	type: string,
): ComponentWithSubcomponents {
	const Component = (props: ComponentProps) =>
		jsx(type as ElementType, { ...props, $action: type });
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
			.map((prop, i) =>
				createElement(Slot, {
					children: rest[prop] as ReactNode,
					key: `slot-${String(prop)}-${i}`,
					name: String(prop),
				}),
			);
		for (const prop of slotProps) delete rest[prop];
		const flatChildren: ReactNode[] = Array.isArray(children)
			? (children as ReactNode[])
			: children
				? [children as ReactNode]
				: [];
		return jsx(type as ElementType, {
			...rest,
			children: [...flatChildren, ...slots],
		});
	};
	Component.displayName = type;
	return Component as ComponentWithSubcomponents;
}
