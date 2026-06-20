import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { idbGet } from "./indexed_db";
import { RECIPES_CACHE_KEY, MEAL_PLAN_CACHE_KEY } from "./cache_keys";
import { getRecipesQueryKey, getMealPlanQueryKey } from "../../client/hooks";

/**
 * Seeds the react-query cache from IndexedDB on mount so recipes/meal plan
 * can render instantly on first paint, without waiting for auth to resolve
 * or the network request to complete. The Orval-generated query functions
 * cache a raw axios-response-shaped object, so we wrap the stored payload
 * in `{ data: payload }` to match what `select` expects to unwrap.
 *
 * It doesn't matter whose data this is or whether the session is still
 * valid - we just show whatever is cached. useAppSession clears IndexedDB
 * on sign out, so by the time this runs there's nothing left to show for a
 * logged-out user.
 *
 * If a real query response is already cached (e.g. from a previous fetch
 * this session) it takes priority and the IndexedDB value is ignored.
 */
export const useHydrateCacheFromIndexedDb = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const recipesKey = getRecipesQueryKey();
    const mealPlanKey = getMealPlanQueryKey();

    idbGet(RECIPES_CACHE_KEY).then((payload) => {
      if (payload !== undefined && queryClient.getQueryData(recipesKey) === undefined) {
        queryClient.setQueryData(recipesKey, { data: payload });
      }
    });

    idbGet(MEAL_PLAN_CACHE_KEY).then((payload) => {
      if (payload !== undefined && queryClient.getQueryData(mealPlanKey) === undefined) {
        queryClient.setQueryData(mealPlanKey, { data: payload });
      }
    });
  }, [queryClient]);
};
