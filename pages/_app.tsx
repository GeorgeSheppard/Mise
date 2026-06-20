import "../styles/globals.css";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import * as React from "react";
import { AppLayout } from "../components/app-layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useHydrateCacheFromIndexedDb } from "../core/storage/use_hydrate_cache_from_indexed_db";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000,
      cacheTime: 1 * 60 * 60 * 1000, // 1 hour
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      structuralSharing: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export interface IKitchenCalmProps {
  Component: React.JSXElementConstructor<any>;
  pageProps: any & { session: Session };
}

function AppContent(props: IKitchenCalmProps) {
  const { Component } = props;
  const { session, ...pageProps } = props.pageProps;

  // Seed the query cache from IndexedDB so recipes/meal plan can render
  // instantly, before auth has resolved or the network request completes.
  useHydrateCacheFromIndexedDb();

  return (
    <SessionProvider session={session}>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </SessionProvider>
  );
}

function KitchenCalm(props: IKitchenCalmProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <AppContent {...props} />
    </QueryClientProvider>
  );
}

export default KitchenCalm;
