import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { CustomSession } from "../../pages/api/auth/[...nextauth]";
import { setPreviouslyAuthenticated } from "./auth_flag";

export const useAppSession = () => {
  const session = useSession();
  const data = session.data as CustomSession | null;
  const isAuthenticated = session.status === "authenticated" && !data?.error;

  useEffect(() => {
    if (data?.error === "RefreshAccessTokenError") {
      signOut();
    }
  }, [data?.error]);

  useEffect(() => {
    if (session.status === "loading") return;
    setPreviouslyAuthenticated(isAuthenticated);
  }, [session.status, isAuthenticated]);

  return {
    id: data?.id,
    accessToken: (data as any)?.accessToken as string | undefined,
    loading: session.status === "loading",
    isAuthenticated,
  }
};
