/**
 * Wrapper hooks around Orval-generated hooks
 * Simplifies the interface by extracting data from responses
 * Automatically includes Bearer token authentication
 */

import { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { useEffect } from 'react';
import { useAppSession } from '../core/hooks/use_app_session';
import { IRecipe } from '../core/types/recipes';
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
  PostKitchencalmS3SignedUrlBody,
  PostKitchencalmS3UploadBody,
  PostKitchencalmS3DeleteBody,
  PostKitchencalmParseRecipeBody,
  PutKitchencalmMealPlan200,
  DeleteKitchencalmRecipesUuid200,
  PostKitchencalmS3SignedUrl200,
  PostKitchencalmS3Upload200,
  PostKitchencalmS3Delete200,
} from './generated/hooks';

/**
 * Helper function to get authorization headers with Bearer token
 */
const getAuthHeaders = (accessToken: string | undefined) => {
  if (!accessToken) return {};
  return { authorization: `Bearer ${accessToken}` };
};

/**
 * Get all recipes - extracts data from response
 */
export const useGetRecipes = (
  options?: {
    query?: UseQueryOptions<any>;
    axios?: AxiosRequestConfig;
  }
) => {
  const { accessToken } = useAppSession();

  const query = useGetKitchencalmRecipesBase({
    query: {
      ...options?.query,
      enabled: (options?.query?.enabled ?? true) && !!accessToken,
      select: (response: any) => response.data,
    },
    axios: {
      ...options?.axios,
      headers: {
        ...getAuthHeaders(accessToken),
        ...options?.axios?.headers,
      },
    },
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
    query?: UseQueryOptions<any>;
    axios?: AxiosRequestConfig;
  }
) => {
  const { accessToken } = useAppSession();

  const query = useGetKitchencalmMealPlanBase({
    query: {
      ...options?.query,
      enabled: (options?.query?.enabled ?? true) && !!accessToken,
      select: (response: any) => response.data,
    },
    axios: {
      ...options?.axios,
      headers: {
        ...getAuthHeaders(accessToken),
        ...options?.axios?.headers,
      },
    },
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
  const { accessToken } = useAppSession();
  const mutation = usePutKitchencalmMealPlanBase({
    axios: { headers: getAuthHeaders(accessToken) },
  });

  return {
    ...mutation,
    mutate: (mealPlan: MealPlan) => {
      mutation.mutate({ data: mealPlan });
    },
    mutateAsync: async (mealPlan: MealPlan) => {
      const response = await mutation.mutateAsync({ data: mealPlan });
      return response.data;
    },
  };
};

/**
 * Delete recipe - simplified interface
 */
export const useDeleteRecipe = () => {
  const { accessToken } = useAppSession();
  const mutation = useDeleteKitchencalmRecipesUuidBase({
    axios: { headers: getAuthHeaders(accessToken) },
  });

  return {
    ...mutation,
    mutate: (uuid: string) => {
      mutation.mutate({ uuid });
    },
    mutateAsync: async (uuid: string) => {
      const response = await mutation.mutateAsync({ uuid });
      return response.data;
    },
  };
};

/**
 * Get S3 signed URL - simplified interface
 */
export const useGetSignedUrl = () => {
  const { accessToken } = useAppSession();
  const mutation = usePostKitchencalmS3SignedUrlBase({
    axios: { headers: getAuthHeaders(accessToken) },
  });

  return {
    ...mutation,
    mutateAsync: async (key: string) => {
      const response = await mutation.mutateAsync({ data: { key } });
      return response.data;
    },
  };
};

/**
 * Get S3 upload URL - simplified interface
 */
export const useGetUploadUrl = () => {
  const { accessToken } = useAppSession();
  const mutation = usePostKitchencalmS3UploadBase({
    axios: { headers: getAuthHeaders(accessToken) },
  });

  return {
    ...mutation,
    mutateAsync: async (params: PostKitchencalmS3UploadBody) => {
      const response = await mutation.mutateAsync({ data: params });
      return response.data;
    },
  };
};

/**
 * Delete S3 object - simplified interface
 */
export const useDeleteS3Object = () => {
  const { accessToken } = useAppSession();
  const mutation = usePostKitchencalmS3DeleteBase({
    axios: { headers: getAuthHeaders(accessToken) },
  });

  return {
    ...mutation,
    mutateAsync: async (key: string) => {
      const response = await mutation.mutateAsync({ data: { key } });
      return response.data;
    },
  };
};

/**
 * Parse recipe from natural language text - simplified interface
 * Supports both creating new recipes and editing existing ones (via recipeId)
 */
export const useParseRecipe = () => {
  const { accessToken } = useAppSession();
  const mutation = usePostKitchencalmParseRecipeBase({
    axios: { headers: getAuthHeaders(accessToken) },
  });

  return {
    ...mutation,
    mutateAsync: async (params: PostKitchencalmParseRecipeBody) => {
      const response = await mutation.mutateAsync({ data: params });
      return response.data;
    },
  };
};

/**
 * Create a long-lived MCP bearer token - simplified interface
 */
export const useCreateMcpToken = () => {
  const { accessToken } = useAppSession();
  const mutation = usePostMcpAuthTokenBase({
    axios: { headers: getAuthHeaders(accessToken) },
  });

  return {
    ...mutation,
    mutateAsync: async (): Promise<string> => {
      const response = await mutation.mutateAsync();
      return response.data.token;
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
