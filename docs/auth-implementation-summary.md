# Authentication Implementation Summary

Complete replacement for NextAuth using backend OAuth with Cognito.

## Backend Implementation Required

See `docs/auth-api-spec.md` for detailed endpoint specifications.

### Endpoints to Implement:

1. **GET /auth/login** - Redirects to Cognito OAuth
2. **GET /auth/callback** - OAuth callback, exchanges code for tokens
3. **GET /auth/session** - Returns current user or 401
4. **POST /auth/logout** - Clears session, returns Cognito logout URL

### Key Backend Requirements:

- **CORS**: Enable credentials with frontend origins
- **Session Cookie**: HttpOnly, Secure, SameSite=Lax, 30-day expiry
- **Token Refresh**: Auto-refresh expired tokens in GET /auth/session
- **JWT Validation**: Verify ID token signature, nonce, issuer, audience

---

## Frontend Implementation (Complete)

### File Structure

```
src/
├── auth/
│   ├── AuthProvider.tsx      # React context provider
│   └── auth-api.ts            # API client functions
├── hooks/
│   └── use_app_session.ts     # Backward-compatible hook
└── main.tsx                   # App entry point

core/hooks/
└── use_app_session.ts         # Updated to use new auth
```

### 1. Auth API Client (`src/auth/auth-api.ts`)

Low-level functions to communicate with backend:

```typescript
// Fetch current user
const user = await getSession();

// Initiate login (redirects to backend)
signIn();

// Logout (clears session and redirects to Cognito)
await signOut();
```

### 2. Auth Provider (`src/auth/AuthProvider.tsx`)

React context that provides auth state:

```typescript
const { user, isLoading, isAuthenticated, signIn, signOut } = useAuth();
```

Features:
- Auto-fetches session on mount
- Refetches on window focus
- Refetches every 15 minutes
- Provides loading state

### 3. App Session Hook (`core/hooks/use_app_session.ts`)

Backward-compatible hook for existing code:

```typescript
const { id, loading, isAuthenticated } = useAppSession();
```

Features:
- Clears IndexedDB cache on logout
- Compatible with existing usage

### 4. Updated Components

**src/main.tsx**
- Replaced `SessionProvider` with `AuthProvider`
- Removed `next-auth/react` import

**components/app-header.tsx**
- Uses `useAuth()` instead of NextAuth hooks
- Sign in/out buttons call new auth functions

---

## Authentication Flow

### Login Flow

```
1. User clicks "Sign In" button
   └─> Calls signIn()

2. Frontend redirects to backend
   └─> GET https://api.georgesheppard.dev/auth/login

3. Backend redirects to Cognito
   └─> GET https://mylifeuserpooldomainproduction.auth.us-east-1.amazoncognito.com/oauth2/authorize

4. User authenticates with Cognito
   └─> Cognito redirects back to backend callback

5. Backend exchanges code for tokens
   └─> POST to Cognito /oauth2/token

6. Backend creates session cookie
   └─> Set-Cookie: session=<encrypted-data>

7. Backend redirects to frontend
   └─> User is now logged in

8. Frontend auto-fetches session
   └─> GET /auth/session
   └─> Returns { user: { id, email } }
```

### Session Management

- Frontend checks session via React Query
- Automatically refetches every 15 minutes
- Backend auto-refreshes expired tokens using refresh token
- If refresh fails, backend returns 401 → user is logged out

### Logout Flow

```
1. User clicks "Sign Out" button
   └─> Calls signOut()

2. Frontend POSTs to backend
   └─> POST /auth/logout

3. Backend clears session cookie
   └─> Returns cognitoLogoutUrl

4. Frontend redirects to Cognito logout
   └─> Fully signs out from Cognito

5. Cognito redirects back to frontend
   └─> User is logged out
```

---

## Environment Variables

### Frontend (.env.development.local / .env.production.local)

```env
VITE_API_BASE_URL=https://api.georgesheppard.dev
VITE_APP_URL=http://localhost:3000
```

### Backend (Your API server)

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

## Usage Examples

### In Components

```typescript
import { useAuth } from '@/src/auth/AuthProvider';

function MyComponent() {
  const { user, isLoading, isAuthenticated, signIn, signOut } = useAuth();

  if (isLoading) return <Spinner />;

  if (!isAuthenticated) {
    return <button onClick={signIn}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protected Routes

```typescript
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/" />;

  return children;
}
```

### Making Authenticated API Calls

The session cookie is automatically sent with every request:

```typescript
// No need to manually pass tokens!
const response = await fetch('https://api.georgesheppard.dev/api/recipes', {
  credentials: 'include', // Send cookies
});
```

---

## Migration Checklist

### Frontend (Complete ✓)

- [x] Created AuthProvider
- [x] Created auth API client
- [x] Updated useAppSession hook
- [x] Updated app-header component
- [x] Replaced SessionProvider in main.tsx
- [x] Updated environment variables

### Backend (TODO)

- [ ] Implement GET /auth/login
- [ ] Implement GET /auth/callback
- [ ] Implement GET /auth/session
- [ ] Implement POST /auth/logout
- [ ] Configure CORS with credentials
- [ ] Set up session cookie encryption
- [ ] Add JWT verification (JWKS)
- [ ] Add token refresh logic
- [ ] Test OAuth flow end-to-end

### Cleanup (After backend is working)

- [ ] Remove `next-auth` from package.json
- [ ] Delete `pages/api/auth/` directory
- [ ] Delete old .env variables (AWS secrets, etc.)
- [ ] Test all auth flows (login, logout, refresh)

---

## Security Notes

- **Session cookie is HttpOnly** - JavaScript cannot access it (prevents XSS)
- **Credentials in CORS** - Required to send cookies cross-origin
- **Backend validates JWT** - Must verify signature, issuer, audience
- **Token refresh on backend** - Access tokens never exposed to frontend
- **State/nonce validation** - Prevents CSRF and replay attacks

---

## Testing

### Manual Testing Steps

1. **Test Login**
   - Click "Sign In"
   - Verify redirect to Cognito
   - Login with credentials
   - Verify redirect back to app
   - Verify user appears in header

2. **Test Session Persistence**
   - Refresh page
   - Verify still logged in
   - Close tab and reopen
   - Verify still logged in

3. **Test Logout**
   - Click "Sign Out"
   - Verify redirect to Cognito logout
   - Verify redirect back to app
   - Verify logged out state

4. **Test Session Expiry**
   - Wait for access token to expire (1 hour)
   - Trigger a request
   - Verify token is auto-refreshed
   - Verify still logged in

---

## Troubleshooting

### "Not authenticated" error immediately after login

- Check CORS is configured with `credentials: true`
- Check cookie `SameSite` setting (use `Lax`)
- Check cookie `Domain` (should be unset for cross-origin)

### Infinite login redirect loop

- Check state validation in callback
- Check redirect_uri matches exactly
- Check session cookie is being set

### Session not persisting across page refreshes

- Check cookie `Max-Age` is set (30 days)
- Check cookie is `HttpOnly` and `Secure`
- Check browser is not blocking third-party cookies

---

## Next Steps

1. Implement backend auth endpoints (see auth-api-spec.md)
2. Test OAuth flow end-to-end
3. Remove NextAuth dependencies
4. Deploy and test in production
