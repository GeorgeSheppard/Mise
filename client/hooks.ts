/**
 * Wrapper hooks around Orval-generated hooks
 * Simplifies the interface by extracting data from responses
 * Authentication is handled automatically via session cookies
 * Persistence is handled automatically by React Query's persister
 */

import { UseQueryOptions } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useAppSession } from '../core/hooks/use_app_session';
import {
  useGetMiseRecipes as useGetMiseRecipesBase,
  useGetMiseMealPlan as useGetMiseMealPlanBase,
  usePutMiseMealPlan as usePutMiseMealPlanBase,
  useDeleteMiseRecipesUuid as useDeleteMiseRecipesUuidBase,
  usePostMiseS3SignedUrl as usePostMiseS3SignedUrlBase,
  usePostMiseS3Upload as usePostMiseS3UploadBase,
  usePostMiseS3Delete as usePostMiseS3DeleteBase,
  usePostMiseParseRecipe as usePostMiseParseRecipeBase,
  usePostMcpAuthToken as usePostMcpAuthTokenBase,
  getGetMiseRecipesQueryKey,
  getGetMiseMealPlanQueryKey,
  MealPlan,
  PostMiseS3UploadBody,
  PostMiseParseRecipeBody,
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

  return useGetMiseRecipesBase({
    query: {
      ...options?.query,
      enabled: (options?.query?.enabled ?? true) && isAuthenticated,
    },
    request: options?.axios,
  });
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

  return useGetMiseMealPlanBase({
    query: {
      ...options?.query,
      enabled: (options?.query?.enabled ?? true) && isAuthenticated,
    },
    request: options?.axios,
  });
};

/**
 * Update meal plan - simplified interface
 */
export const useUpdateMealPlan = () => {
  const mutation = usePutMiseMealPlanBase();

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
  const mutation = useDeleteMiseRecipesUuidBase();

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
  const mutation = usePostMiseS3SignedUrlBase();

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
  const mutation = usePostMiseS3UploadBase();

  return {
    ...mutation,
    mutateAsync: async (params: PostMiseS3UploadBody) => {
      return await mutation.mutateAsync({ data: params });
    },
  };
};

/**
 * Delete S3 object - simplified interface
 */
export const useDeleteS3Object = () => {
  const mutation = usePostMiseS3DeleteBase();

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
  const mutation = usePostMiseParseRecipeBase();

  return {
    ...mutation,
    mutateAsync: async (params: PostMiseParseRecipeBody) => {
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
  getGetMiseRecipesQueryKey as getRecipesQueryKey,
  getGetMiseMealPlanQueryKey as getMealPlanQueryKey,
};

// Export aliases for backward compatibility
export { useGetRecipes as useGetMiseRecipes };
export { useGetMealPlan as useGetMiseMealPlan };
