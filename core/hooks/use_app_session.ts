import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { CustomSession } from "../../pages/api/auth/[...nextauth]";
import { idbDelete } from "../storage/indexed_db";
import { RECIPES_CACHE_KEY, MEAL_PLAN_CACHE_KEY } from "../storage/cache_keys";

export const useAppSession = () => {
  const session = useSession();
  const data = session.data as CustomSession | null;
  const isAuthenticated = session.status === "authenticated" && !data?.error;

  useEffect(() => {
    if (data?.error === "RefreshAccessTokenError") {
      signOut();
    }
  }, [data?.error]);

  useEffect(() => {
    if (session.status === "unauthenticated") {
      idbDelete(RECIPES_CACHE_KEY);
      idbDelete(MEAL_PLAN_CACHE_KEY);
    }
  }, [session.status]);

  return {
    id: data?.id,
    accessToken: (data as any)?.accessToken as string | undefined,
    loading: session.status === "loading",
    isAuthenticated,
  }
};
