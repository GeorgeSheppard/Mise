import { useAuth } from '@/src/auth/AuthProvider';

/**
 * Hook to get current app session
 * Replacement for NextAuth's useSession
 *
 * Returns:
 * - id: User ID (Cognito sub)
 * - loading: Whether session is loading
 */
export function useAppSession() {
  const { user, isLoading } = useAuth();

  return {
    id: user?.id || null,
    loading: isLoading,
  };
}
