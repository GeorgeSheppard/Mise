import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSession, signIn, signOut, User } from './auth-api';
import {
  getGetKitchencalmRecipesQueryKey,
  getGetKitchencalmMealPlanQueryKey,
} from '@/client/generated/hooks';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const previousAuthState = useRef<boolean>(false);

  // Fetch session on mount and periodically
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: getSession,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });

  const isAuthenticated = !!user;

  // Invalidate recipes and meal plan when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !previousAuthState.current) {
      // User just logged in, invalidate to fetch fresh data
      queryClient.invalidateQueries({
        queryKey: getGetKitchencalmRecipesQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getGetKitchencalmMealPlanQueryKey(),
      });
    }
    previousAuthState.current = isAuthenticated;
  }, [isAuthenticated, queryClient]);

  const value: AuthContextValue = {
    user: user || null,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
