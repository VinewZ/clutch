import { cn } from "@/lib/utils";
import type { RaycastComponentProps } from "./registry";
import { useFormContext } from "./Form";
import { sendAction } from "@/services/extension";

export function Action({ node, onEvent }: RaycastComponentProps) {
	const title = node.props.title as string | undefined;
	const shortcut = node.props.shortcut as
		| { modifiers?: string[]; key?: string }
		| undefined;
	const onAction = node.props.onAction as { $handler: string } | undefined;
	const $action = node.props.$action as string | undefined;
	const style = node.props.style as string | undefined;
	const formCtx = useFormContext();

	const isSubmitForm = node.type === "Action.SubmitForm";

	const handleClick = () => {
		if (isSubmitForm && formCtx) {
			formCtx.submitForm();
			return;
		}
		if ($action) {
			sendAction($action, node.props, onAction?.$handler);
			return;
		}
		if (onAction?.$handler) onEvent?.(onAction.$handler, {});
	};

	return (
		<button
			type={isSubmitForm ? "submit" : "button"}
			data-node-type={node.type}
			data-node-id={node.id}
			onClick={handleClick}
			className={cn(
				"flex items-center gap-2 w-full px-3 py-2 text-sm rounded transition-colors text-left",
				style === "destructive"
					? "hover:bg-destructive hover:text-destructive-foreground"
					: "hover:bg-accent",
			)}
		>
			<span className="flex-1 truncate">
				{title ?? node.type.replace("Action.", "")}
			</span>
			{shortcut && (
				<kbd className="text-[10px] text-muted-foreground font-mono">
					{shortcut.modifiers?.join("+")}
					{shortcut.modifiers?.length ? "+" : ""}
					{shortcut.key}
				</kbd>
			)}
		</button>
	);
}
