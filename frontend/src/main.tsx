import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "@/index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import { ThemeProvider } from "./providers/theme.tsx";
import reportWebVitals from "./reportWebVitals.ts";
import { ConfirmShellDialog } from "./routes/-components/confirm_shell_dialog/index.tsx";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <ConfirmShellDialog />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            closeOnClick={true}
            pauseOnHover={true}
            pauseOnFocusLoss={false}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
