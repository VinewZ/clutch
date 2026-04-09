import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
	({ value, onChange, placeholder }, ref) => {
		return (
			<Input
				ref={ref}
				type="search"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full py-6 text-lg"
				autoFocus
			/>
		);
	},
);

SearchInput.displayName = "SearchInput";
