import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./auth/AuthProvider";
import { App } from "./App";
import { createIDBPersister } from "./lib/query-persister";
import {
  getGetKitchencalmRecipesQueryKey,
  getGetKitchencalmMealPlanQueryKey,
} from "@/client/generated/hooks";

// Self-hosted fonts - only load weights we use (400, 500, 600, 700)
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-serif-display/400.css";

import "@/styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes
      cacheTime: 14 * 24 * 60 * 60 * 1000, // 2 weeks - keep in cache for persistence
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      structuralSharing: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const persister = createIDBPersister();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        // Cache restored from IndexedDB on full reload - refetch recipes and
        // meal plan in the background so stale persisted data doesn't linger.
        queryClient.invalidateQueries({
          queryKey: getGetKitchencalmRecipesQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetKitchencalmMealPlanQueryKey(),
        });
      }}
    >
      <ReactQueryDevtools initialIsOpen={false} />
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </PersistQueryClientProvider>
  </React.StrictMode>
);
