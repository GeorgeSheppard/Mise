import { useEffect, useRef } from "react";
import { useAuth } from "../../src/auth/AuthProvider";
import { idbDelete } from "../storage/indexed_db";
import { RECIPES_CACHE_KEY, MEAL_PLAN_CACHE_KEY } from "../storage/cache_keys";

export const useAppSession = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const wasAuthenticatedRef = useRef(isAuthenticated);

  // Clear IndexedDB cache when user logs out
  useEffect(() => {
    if (wasAuthenticatedRef.current && !isAuthenticated && !isLoading) {
      idbDelete(RECIPES_CACHE_KEY);
      idbDelete(MEAL_PLAN_CACHE_KEY);
    }
    wasAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading]);

  return {
    id: user?.id,
    loading: isLoading,
    isAuthenticated,
  };
};
