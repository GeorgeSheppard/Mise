import { RecipeUuid } from "../../types/recipes";
import { useAppSession } from "../../hooks/use_app_session";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteRecipe, getRecipesQueryKey, getMealPlanQueryKey } from "../../../client/hooks";
import { GetKitchencalmRecipes200, MealPlan } from "../../../client/generated/hooks";

const useDeleteRecipeInCache = () => {
  const queryClient = useQueryClient();
  const recipesKey = getRecipesQueryKey();
  const mealPlanKey = getMealPlanQueryKey();

  return (recipeId: RecipeUuid) => {
    const previousRecipesCache = queryClient.getQueryData<GetKitchencalmRecipes200>(recipesKey);
    const previousMealPlanCache = queryClient.getQueryData<MealPlan>(mealPlanKey);

    if (previousRecipesCache) {
      const { [recipeId]: _removed, ...remainingRecipes } = previousRecipesCache;
      queryClient.setQueryData(recipesKey, remainingRecipes);
    }

    if (previousMealPlanCache && Array.isArray(previousMealPlanCache)) {
      const updatedMealPlan = previousMealPlanCache.map((item) => ({
        ...item,
        plan: item.plan.filter((r) => r.recipeId !== recipeId),
      }));
      queryClient.setQueryData(mealPlanKey, updatedMealPlan);
    }

    return {
      undo: () => {
        queryClient.setQueryData(recipesKey, previousRecipesCache);
        queryClient.setQueryData(mealPlanKey, previousMealPlanCache);
      },
    };
  };
};

export const useDeleteRecipeFromDynamo = () => {
  const { loading } = useAppSession();
  const mutate = useDeleteRecipeInCache();
  const deleteRecipe = useDeleteRecipe();

  return {
    ...deleteRecipe,
    mutateAsync: async (uuid: string) => {
      const context = mutate(uuid);

      try {
        return await deleteRecipe.mutateAsync(uuid);
      } catch (error) {
        context.undo();
        throw error;
      }
    },
    disabled: loading,
  };
};
