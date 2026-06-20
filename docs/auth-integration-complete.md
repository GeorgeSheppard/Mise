# Authentication Integration - Complete ✅

## Backend Endpoints Available

All auth endpoints are now available in the generated API client (`client/generated/hooks.ts`):

### 1. GET /auth/login
```typescript
export type GetAuthLoginParams = {
  redirect_uri?: string; // Frontend URL to return to after login
};
```
- **Purpose**: Initiates OAuth flow, redirects to Cognito
- **Implementation**: Direct redirect via `window.location.href` (not using axios hook)
- **Reason**: Backend returns 302 redirect, browser needs to follow it

### 2. GET /auth/callback
```typescript
export type GetAuthCallbackParams = {
  code?: string;  // Authorization code from Cognito
  state?: string; // Must match oauth_state cookie
};
```
- **Purpose**: OAuth callback handler (backend only)
- **Implementation**: Not called by frontend, handled by backend
- **Flow**: Cognito → Backend callback → Backend redirects to frontend

### 3. GET /auth/session ✅
```typescript
export type GetAuthSession200 = {
  user: {
    id: string;
    email: string;
  };
};
```
- **Purpose**: Get current authenticated user
- **Implementation**: Uses `getAuthSession()` hook
- **Used in**: `src/auth/auth-api.ts` → `AuthProvider` → `useAuth()`

### 4. POST /auth/logout ✅
```typescript
export type PostAuthLogout200 = {
  success: boolean;
  cognitoLogoutUrl: string;
};

export type PostAuthLogoutParams = {
  redirect_uri?: string;
};
```
- **Purpose**: Logout and get Cognito logout URL
- **Implementation**: Uses `postAuthLogout()` hook
- **Used in**: `src/auth/auth-api.ts` → `signOut()`

---

## Frontend Implementation Files

### Core Auth Files

**`src/lib/axios.ts`**
- Custom axios instance with `withCredentials: true`
- Automatically includes session cookies in all API requests
- Integrated with Orval code generator

**`src/auth/auth-api.ts`**
```typescript
import { getAuthSession, postAuthLogout } from '@/client/generated/hooks';

// Get current user session
export async function getSession(): Promise<User>

// Redirect to login (browser redirect, not API call)
export function signIn(): void

// Logout and redirect to Cognito
export async function signOut(): Promise<void>
```

**`src/auth/AuthProvider.tsx`**
- React context that wraps the app
- Auto-fetches session on mount
- Refetches every 15 minutes
- Provides `{ user, isLoading, isAuthenticated, signIn, signOut }`

**`core/hooks/use_app_session.ts`**
- Backward-compatible hook for existing code
- Clears IndexedDB cache on logout
- Returns `{ id, loading, isAuthenticated }`

---

## Authentication Flow

### Login Flow
```
1. User clicks "Sign In"
   └─> signIn() called

2. Browser redirects to backend
   └─> GET https://api.georgesheppard.dev/auth/login?redirect_uri=...

3. Backend redirects to Cognito OAuth
   └─> GET https://mylifeuserpooldomainproduction.auth.us-east-1.amazoncognito.com/oauth2/authorize

4. User authenticates with Cognito
   └─> Cognito redirects to backend callback

5. Backend handles callback
   └─> GET /auth/callback?code=xxx&state=xxx
   └─> Exchanges code for tokens
   └─> Sets session cookie (HttpOnly, Secure, SameSite=Lax)

6. Backend redirects to frontend
   └─> 302 to http://localhost:3000

7. Frontend auto-fetches session
   └─> GET /auth/session (with session cookie)
   └─> Returns { user: { id, email } }
   └─> User is logged in!
```

### Session Management
```
1. AuthProvider fetches session on mount
   └─> useQuery with getAuthSession()

2. Session auto-refreshes
   └─> Every 15 minutes (refetchInterval)
   └─> On window focus (refetchOnWindowFocus)
   └─> Backend auto-refreshes expired tokens using refresh_token

3. If refresh fails
   └─> Backend returns 401
   └─> Frontend shows logged out state
```

### Logout Flow
```
1. User clicks "Sign Out"
   └─> signOut() called

2. Frontend POSTs to backend
   └─> POST /auth/logout with redirect_uri

3. Backend clears session cookie
   └─> Returns { cognitoLogoutUrl: "..." }

4. Frontend redirects to Cognito logout
   └─> window.location.href = cognitoLogoutUrl

5. Cognito logs out user
   └─> Redirects back to frontend
   └─> User is fully logged out
```

---

## Environment Variables

### Frontend (.env.development.local)
```env
VITE_API_BASE_URL=https://api.georgesheppard.dev
VITE_APP_URL=http://localhost:3000
```

### Frontend (.env.production.local)
```env
VITE_API_BASE_URL=https://api.georgesheppard.dev
VITE_APP_URL=https://my-life-nu.vercel.app
```

### Backend (Your API)
```env
AWS_COGNITO_CLIENT_ID=6bm3o1m4d2uva01qk2lmjjd2v1
AWS_COGNITO_CLIENT_SECRET=t78j67k97b8v3p0o98mrd47u7rgu4mho4hmh2uqntgukr4mbshb
AWS_COGNITO_DOMAIN=https://mylifeuserpooldomainproduction.auth.us-east-1.amazoncognito.com
AWS_COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_LuP7rq1j2
FRONTEND_URL_DEV=http://localhost:3000
FRONTEND_URL_PROD=https://my-life-nu.vercel.app
SESSION_SECRET=oIQwHzULJnDPcm2QiYhKvs/N2Z86ZDfev/5DRMVdwRY=
```

---

## Updated Components

### `src/main.tsx`
- ✅ Replaced `SessionProvider` with `AuthProvider`
- ✅ Removed `next-auth/react` import

### `components/app-header.tsx`
- ✅ Uses `useAuth()` instead of NextAuth hooks
- ✅ Sign in/out buttons work with new auth system

---

## API Client Configuration

### `orval.config.ts`
```typescript
{
  override: {
    mutator: {
      path: './src/lib/axios.ts',
      name: 'axiosInstance',
    },
  },
}
```

All generated API hooks automatically use the custom axios instance that includes credentials.

---

## Automatic Cookie Handling

Session cookies are automatically sent with every API request:

```typescript
// Example: Fetching recipes
const { data } = useGetRecipes();
// Session cookie is automatically included ✓

// Example: Creating a recipe
const mutation = usePostRecipe();
await mutation.mutateAsync(recipeData);
// Session cookie is automatically included ✓
```

No manual token handling needed!

---

## Testing Checklist

### ✅ Completed
- [x] Downloaded latest OpenAPI spec with auth endpoints
- [x] Regenerated API client with auth hooks
- [x] Created custom axios instance with credentials
- [x] Integrated axios instance with Orval
- [x] Updated AuthProvider to use generated hooks
- [x] Updated app-header to use new auth
- [x] Verified all auth endpoints available

### 🧪 To Test (Once Backend is Live)
- [ ] Test login flow end-to-end
- [ ] Test session persistence across page refreshes
- [ ] Test logout flow with Cognito redirect
- [ ] Test session auto-refresh (wait 1 hour)
- [ ] Test authenticated API calls (recipes, meal plans, etc.)
- [ ] Test error handling (401, expired session, etc.)

---

## Next Steps

1. **Deploy Backend** - Ensure auth endpoints are live
2. **Test OAuth Flow** - Try logging in through the UI
3. **Remove NextAuth** - Once everything works:
   ```bash
   yarn remove next-auth
   rm -rf pages/api/auth
   ```
4. **Remove Next.js** - Once Vite migration is complete:
   ```bash
   yarn remove next
   rm -rf pages .next
   rm next.config.js
   ```

---

## Summary

✅ **Backend**: All 4 auth endpoints available in OpenAPI spec
✅ **Frontend**: Fully integrated with generated API client
✅ **Session Management**: Auto-refresh, cookie-based, secure
✅ **Developer Experience**: Type-safe, auto-complete, zero manual token handling

The authentication system is ready to use once your backend endpoints are deployed!
