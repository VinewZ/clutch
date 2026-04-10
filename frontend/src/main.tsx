import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./components/ui/theme-provider";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: true,
			staleTime: 60000,
		},
	},
});

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	scrollRestoration: true,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("app");

if (!rootElement?.innerHTML) {
	if (rootElement) {
		const root = ReactDOM.createRoot(rootElement);
		root.render(
			<ThemeProvider defaultTheme="dark" storageKey="theme">
				<HotkeysProvider
					defaultOptions={{
						hotkey: {
							preventDefault: true,
							target: window,
							platform: "linux",
							ignoreInputs: false,
						},
					}}
				>
					<QueryClientProvider client={queryClient}>
						<RouterProvider router={router} />
					</QueryClientProvider>
				</HotkeysProvider>
			</ThemeProvider>,
		);
	}
}
