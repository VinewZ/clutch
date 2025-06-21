import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MainInputProps = {
	inputRef: React.RefObject<HTMLInputElement | null>;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
};

export function MainInput({
	inputRef,
	value,
	onChange,
	placeholder,
	className,
}: MainInputProps) {
	return (
		<Input
			ref={inputRef}
			className={cn(
				"fixed top-0 right-0 left-0 z-50 h-[50px] rounded-none border-0 border-b bg-zinc-800!",
				className,
			)}
			value={value}
			placeholder={placeholder ? placeholder : `Type "/" to search...`}
			onChange={(e) => {
				onChange(e.target.value);
			}}
		/>
	);
}
