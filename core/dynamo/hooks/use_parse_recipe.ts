import { useParseRecipe } from '../../../client/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { getRecipesQueryKey } from '../../../client/hooks';
import { GetMiseRecipes200 } from '../../../client/generated/hooks';

/**
 * Hook for parsing recipe text and adding it to the recipe cache
 * Returns the parsed recipe and updates the query cache automatically
 * Supports editing existing recipes by providing an optional recipeId
 */
export const useParsedRecipeToDynamo = () => {
  const queryClient = useQueryClient();
  const parseRecipe = useParseRecipe();
  const recipesKey = getRecipesQueryKey();

  return {
    ...parseRecipe,
    mutateAsync: async (recipeText: string, recipeId?: string) => {
      // Parse the recipe from the text, optionally with a recipe ID for editing
      const parsedRecipe = await parseRecipe.mutateAsync({
        recipeText,
        recipeId,
      });

      // Log if images property is missing from the parsed recipe
      if (!parsedRecipe.images) {
        console.warn('Parsed recipe missing images property:', parsedRecipe.uuid);
      }

      // Update the query cache with the parsed recipe
      const cachedRecipes = queryClient.getQueryData<GetMiseRecipes200>(recipesKey);
      const recipeUuid = recipeId || parsedRecipe.uuid;

      if (cachedRecipes) {
        queryClient.setQueryData(recipesKey, {
          ...cachedRecipes,
          [recipeUuid]: parsedRecipe,
        });
      } else {
        // No cached data yet — invalidate so /food refetches from the server
        queryClient.invalidateQueries({ queryKey: recipesKey });
      }

      return parsedRecipe;
    },
  };
};
