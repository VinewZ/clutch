import { TanStackDevtools } from "@tanstack/react-devtools";
import { HotkeysDevtoolsPanel } from "@tanstack/react-hotkeys-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import "../styles.css";
import { Footer } from "@/components/Footer";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<>
			<TanStackDevtools
				config={{
					position: "top-right",
					hideUntilHover: true,
				}}
				plugins={[
					{
						name: "TanStack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					{
						name: "TanStack Query",
						render: <ReactQueryDevtoolsPanel />,
					},
					{
						name: "TanStack Hotkeys",
						render: <HotkeysDevtoolsPanel theme="dark" devtoolsOpen={false} />,
					},
				]}
			/>

			<div className="flex flex-col h-screen">
				<div className="flex-1 min-h-0 overflow-hidden">
					<Outlet />
				</div>

				<Footer />
			</div>
		</>
	);
}
