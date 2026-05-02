import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./providers/theme";
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
				<ThemeProvider defaultTheme="dark" storageKey="theme">
					<QueryClientProvider client={queryClient}>
						<RouterProvider router={router} />
					</QueryClientProvider>
				</ThemeProvider>
			</HotkeysProvider>,
		);
	}
}
