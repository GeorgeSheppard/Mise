/**
 * Wrapper hooks around Orval-generated hooks
 * Simplifies the interface by extracting data from responses
 * Authentication is handled automatically via session cookies
 */

import { UseQueryOptions } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useEffect } from 'react';
import { useAppSession } from '../core/hooks/use_app_session';
import { idbSet } from '../core/storage/indexed_db';
import { RECIPES_CACHE_KEY, MEAL_PLAN_CACHE_KEY } from '../core/storage/cache_keys';
import {
  useGetKitchencalmRecipes as useGetKitchencalmRecipesBase,
  useGetKitchencalmMealPlan as useGetKitchencalmMealPlanBase,
  usePutKitchencalmMealPlan as usePutKitchencalmMealPlanBase,
  useDeleteKitchencalmRecipesUuid as useDeleteKitchencalmRecipesUuidBase,
  usePostKitchencalmS3SignedUrl as usePostKitchencalmS3SignedUrlBase,
  usePostKitchencalmS3Upload as usePostKitchencalmS3UploadBase,
  usePostKitchencalmS3Delete as usePostKitchencalmS3DeleteBase,
  usePostKitchencalmParseRecipe as usePostKitchencalmParseRecipeBase,
  usePostMcpAuthToken as usePostMcpAuthTokenBase,
  getGetKitchencalmRecipesQueryKey,
  getGetKitchencalmMealPlanQueryKey,
  MealPlan,
  PostKitchencalmS3UploadBody,
  PostKitchencalmParseRecipeBody,
} from './generated/hooks';

/**
 * Get all recipes - extracts data from response
 */
export const useGetRecipes = (
  options?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query?: UseQueryOptions<any>;
    axios?: AxiosRequestConfig;
  }
) => {
  const { isAuthenticated } = useAppSession();

  const query = useGetKitchencalmRecipesBase({
    query: {
      ...options?.query,
      enabled: (options?.query?.enabled ?? true) && isAuthenticated,
    },
    request: options?.axios,
  });

  useEffect(() => {
    if (query.data !== undefined) {
      idbSet(RECIPES_CACHE_KEY, query.data);
    }
  }, [query.data]);

  return query;
};

/**
 * Get meal plan - extracts data from response
 */
export const useGetMealPlan = (
  options?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query?: UseQueryOptions<any>;
    axios?: AxiosRequestConfig;
  }
) => {
  const { isAuthenticated } = useAppSession();

  const query = useGetKitchencalmMealPlanBase({
    query: {
      ...options?.query,
      enabled: (options?.query?.enabled ?? true) && isAuthenticated,
    },
    request: options?.axios,
  });

  useEffect(() => {
    if (query.data !== undefined) {
      idbSet(MEAL_PLAN_CACHE_KEY, query.data);
    }
  }, [query.data]);

  return query;
};

/**
 * Update meal plan - simplified interface
 */
export const useUpdateMealPlan = () => {
  const mutation = usePutKitchencalmMealPlanBase();

  return {
    ...mutation,
    mutate: (mealPlan: MealPlan) => {
      mutation.mutate({ data: mealPlan });
    },
    mutateAsync: async (mealPlan: MealPlan) => {
      return await mutation.mutateAsync({ data: mealPlan });
    },
  };
};

/**
 * Delete recipe - simplified interface
 */
export const useDeleteRecipe = () => {
  const mutation = useDeleteKitchencalmRecipesUuidBase();

  return {
    ...mutation,
    mutate: (uuid: string) => {
      mutation.mutate({ uuid });
    },
    mutateAsync: async (uuid: string) => {
      return await mutation.mutateAsync({ uuid });
    },
  };
};

/**
 * Get S3 signed URL - simplified interface
 */
export const useGetSignedUrl = () => {
  const mutation = usePostKitchencalmS3SignedUrlBase();

  return {
    ...mutation,
    mutateAsync: async (key: string) => {
      return await mutation.mutateAsync({ data: { key } });
    },
  };
};

/**
 * Get S3 upload URL - simplified interface
 */
export const useGetUploadUrl = () => {
  const mutation = usePostKitchencalmS3UploadBase();

  return {
    ...mutation,
    mutateAsync: async (params: PostKitchencalmS3UploadBody) => {
      return await mutation.mutateAsync({ data: params });
    },
  };
};

/**
 * Delete S3 object - simplified interface
 */
export const useDeleteS3Object = () => {
  const mutation = usePostKitchencalmS3DeleteBase();

  return {
    ...mutation,
    mutateAsync: async (key: string) => {
      return await mutation.mutateAsync({ data: { key } });
    },
  };
};

/**
 * Parse recipe from natural language text - simplified interface
 * Supports both creating new recipes and editing existing ones (via recipeId)
 */
export const useParseRecipe = () => {
  const mutation = usePostKitchencalmParseRecipeBase();

  return {
    ...mutation,
    mutateAsync: async (params: PostKitchencalmParseRecipeBody) => {
      return await mutation.mutateAsync({ data: params });
    },
  };
};

/**
 * Create a long-lived MCP bearer token - simplified interface
 */
export const useCreateMcpToken = () => {
  const mutation = usePostMcpAuthTokenBase();

  return {
    ...mutation,
    mutateAsync: async (): Promise<string> => {
      const response = await mutation.mutateAsync();
      return response.token;
    },
  };
};

// Export query key functions for cache management
export {
  getGetKitchencalmRecipesQueryKey as getRecipesQueryKey,
  getGetKitchencalmMealPlanQueryKey as getMealPlanQueryKey,
};

// Export aliases for backward compatibility
export { useGetRecipes as useGetKitchencalmRecipes };
export { useGetMealPlan as useGetKitchencalmMealPlan };
