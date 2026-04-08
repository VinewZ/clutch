export function useClipboard() {
	const copy = async (text: string): Promise<boolean> => {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			const textArea = document.createElement("textarea");
			textArea.value = text;
			textArea.style.position = "fixed";
			textArea.style.left = "-999999px";
			document.body.appendChild(textArea);
			textArea.select();
			const success = document.execCommand("copy");
			document.body.removeChild(textArea);
			return success;
		}
	};

	return { copy };
}
