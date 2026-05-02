import { createContext, useCallback, useContext, useState } from "react";
import {
	type JsonNodeData,
	renderJsonChildren,
	type TextJsonNodeData,
} from "@/components/JsonNode";
import type { RaycastComponentProps } from "./types";

interface FormContextValue {
	values: Record<string, unknown>;
	setValue: (id: string, value: unknown) => void;
	errors: Record<string, string | undefined>;
	submitForm: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext() {
	return useContext(FormContext);
}

export function Form({ node, onEvent }: RaycastComponentProps) {
	const [values, setValues] = useState<Record<string, unknown>>({});
	const errors = node.props.errors as
		| Record<string, string | undefined>
		| undefined;

	const setValue = useCallback((id: string, value: unknown) => {
		setValues((prev) => ({ ...prev, [id]: value }));
	}, []);

	const onSubmit = node.props.onSubmit as { $handler: string } | undefined;

	const handleSubmit = useCallback(() => {
		if (onSubmit?.$handler) {
			onEvent?.(onSubmit.$handler, { formValues: values });
		}
	}, [onSubmit, values, onEvent]);

	return (
		<FormContext.Provider
			value={{
				values,
				setValue,
				errors: errors ?? {},
				submitForm: handleSubmit,
			}}
		>
			<form
				data-node-type={node.type}
				data-node-id={node.id}
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				className="p-4 space-y-3"
			>
				{renderJsonChildren(
					node.children as (JsonNodeData | TextJsonNodeData)[],
					onEvent,
				)}
			</form>
		</FormContext.Provider>
	);
}
