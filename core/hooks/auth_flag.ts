export const AUTH_FLAG_KEY = "kitchencalm-was-authenticated";

/**
 * next-auth's session cookie is httpOnly, so it can't be read from
 * document.cookie to optimistically decide whether to show cached data.
 * Instead we set this ourselves (in localStorage) once we've confirmed via
 * useSession that the user is authenticated, and clear it on sign out.
 */
export const wasPreviouslyAuthenticated = () => {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(AUTH_FLAG_KEY) === "1";
  } catch {
    return false;
  }
};

export const setPreviouslyAuthenticated = (value: boolean) => {
  try {
    if (typeof localStorage === "undefined") return;
    if (value) {
      localStorage.setItem(AUTH_FLAG_KEY, "1");
    } else {
      localStorage.removeItem(AUTH_FLAG_KEY);
    }
  } catch {
    // Ignore - this is just an optimistic hint.
  }
};
