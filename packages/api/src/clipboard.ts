import { execFile } from "node:child_process";

export async function getSelectedText(): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(
			"wl-paste",
			["--primary", "--no-newline"],
			{ timeout: 2000 },
			(error, stdout, stderr) => {
				if (error) {
					reject(
						new Error(
							"Could not get selected text: " +
								(stderr?.trim() || error.message),
						),
					);
					return;
				}
				const text = stdout.trim();
				if (!text) {
					reject(new Error("No selected text available"));
					return;
				}
				resolve(text);
			},
		);
	});
}
