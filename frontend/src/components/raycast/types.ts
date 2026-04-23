export interface RaycastComponentProps {
	node: {
		type: string;
		props: Record<string, unknown>;
		children: unknown[];
		id: string;
	};
	onEvent?: (handlerId: string, event: unknown) => void;
}
