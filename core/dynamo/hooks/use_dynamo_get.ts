import { mealPlanEmptyState } from "../../meal_plan/meal_plan_utilities";
import { IRecipes, RecipeUuid } from "../../types/recipes";
import { NewRecipe } from "../../../src/pages/food/RecipeFormPage";
import { useAppSession } from "../../hooks/use_app_session";
import { useGetMiseRecipes, useGetMiseMealPlan } from "../../../client/hooks";
import { UseQueryResult } from "@tanstack/react-query";
import { IMealPlan } from "../../types/meal_plan";

const useRecipesBase = <T>({
  select,
  enabled,
}: {
  enabled?: boolean;
  select?: (data: IRecipes) => T;
}): UseQueryResult<T> => {
  const { loading, isAuthenticated } = useAppSession();
  const recipesQuery = useGetMiseRecipes({
    query: {
      enabled: !loading && isAuthenticated && (enabled ?? true),
    },
  });

  // Convert API response (object) to Map format for compatibility
  const recipesMap: IRecipes = recipesQuery.data ? new Map(Object.entries(recipesQuery.data)) : new Map();

  return {
    ...recipesQuery,
    data: select ? select(recipesMap) : (recipesMap as unknown as T),
  } as UseQueryResult<T>;
};

export const useRecipes = () => {
  return useRecipesBase({
    select: (data) => Array.from(data.values()),
  });
};

export const useRecipe = (recipeId?: RecipeUuid, enabled?: boolean) => {
  return useRecipesBase({
    select: (data) => {
      const recipe = data.get(recipeId!);
      return recipe;
    },
    enabled: enabled && !!recipeId && recipeId !== NewRecipe,
  });
};

export const useMealPlan = () => {
  const { loading } = useAppSession();
  const mealPlan = useGetMiseMealPlan({
    query: {
      enabled: !loading,
      placeholderData: mealPlanEmptyState,
    },
  });
  return {
    ...mealPlan,
    data: (mealPlan.data || mealPlanEmptyState) as IMealPlan,
    // placeholderData makes the query report success immediately, so use
    // this to detect the initial fetch is still in flight.
    isInitialLoading: mealPlan.isFetching && mealPlan.isPlaceholderData,
  };
};
