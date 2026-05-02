import { useLocation, useRouter } from "@tanstack/react-router";

export function Footer() {
	const location = useLocation();

	console.log(location);

	return (
		<footer className="flex justify-between border-t p-1">
			<p>Clutch</p>
			<div>actions</div>
		</footer>
	);
}
