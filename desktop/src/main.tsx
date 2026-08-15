import React from "react";
import ReactDOM from "react-dom/client";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@fontsource-variable/fraunces";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";

import App from "./App";
import { errorMessage } from "./components/ui/toast";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Everything is local SQLite over IPC, so refetching is cheap but
      // pointless on focus — invalidation after mutations is what matters.
      refetchOnWindowFocus: false,
      staleTime: 5_000,
      retry: (failureCount, error) =>
        failureCount < 2 && !errorMessage(error).toLowerCase().includes("not found"),
    },
    mutations: { retry: 0 },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Background refetches fail silently; a first load failing is worth logging.
      if (query.state.data === undefined) {
        console.error(`Query ${String(query.queryKey)} failed:`, errorMessage(error));
      }
    },
  }),
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
