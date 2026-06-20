# Authentication API Specification

Backend endpoints to replace NextAuth with Cognito OAuth.

## Environment Variables (Backend Only)

```env
# Cognito Configuration
AWS_COGNITO_CLIENT_ID=6bm3o1m4d2uva01qk2lmjjd2v1
AWS_COGNITO_CLIENT_SECRET=t78j67k97b8v3p0o98mrd47u7rgu4mho4hmh2uqntgukr4mbshb
AWS_COGNITO_DOMAIN=https://mylifeuserpooldomainproduction.auth.us-east-1.amazoncognito.com
AWS_COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_LuP7rq1j2

# App URLs
FRONTEND_URL_DEV=http://localhost:3000
FRONTEND_URL_PROD=https://my-life-nu.vercel.app
BACKEND_URL=https://api.georgesheppard.dev

# Session Secret
SESSION_SECRET=oIQwHzULJnDPcm2QiYhKvs/N2Z86ZDfev/5DRMVdwRY=
```

---

## 1. GET /auth/login

Initiates OAuth login flow by redirecting to Cognito.

### Request

```http
GET /auth/login HTTP/1.1
Host: api.georgesheppard.dev
```

Optional query params:
- `redirect_uri` - Where to redirect after successful login (defaults to frontend root)

### Response

**302 Redirect** to Cognito OAuth URL:

```http
HTTP/1.1 302 Found
Location: https://mylifeuserpooldomainproduction.auth.us-east-1.amazoncognito.com/oauth2/authorize?response_type=code&client_id=6bm3o1m4d2uva01qk2lmjjd2v1&redirect_uri=https://api.georgesheppard.dev/auth/callback&state=<random-state>&nonce=<random-nonce>&scope=openid+email+profile
Set-Cookie: oauth_state=<random-state>; HttpOnly; Secure; SameSite=Lax; Max-Age=600
Set-Cookie: oauth_nonce=<random-nonce>; HttpOnly; Secure; SameSite=Lax; Max-Age=600
Set-Cookie: oauth_redirect=<redirect-uri>; HttpOnly; Secure; SameSite=Lax; Max-Age=600
```

### Implementation Notes

- Generate cryptographically random `state` and `nonce` (e.g., 32 bytes base64url)
- Store `state`, `nonce`, and optional `redirect_uri` in temporary cookies (10 min expiry)
- These cookies are used to validate the callback

---

## 2. GET /auth/callback

OAuth callback from Cognito after user authenticates.

### Request

```http
GET /auth/callback?code=<auth-code>&state=<state-value> HTTP/1.1
Host: api.georgesheppard.dev
Cookie: oauth_state=<state-value>; oauth_nonce=<nonce>; oauth_redirect=<redirect-uri>
```

Query params:
- `code` - Authorization code from Cognito
- `state` - State value to prevent CSRF

### Processing Steps

1. **Validate state** - Compare `state` query param with `oauth_state` cookie
2. **Exchange code for tokens** - POST to Cognito token endpoint
3. **Verify ID token** - Validate JWT signature and claims
4. **Create session** - Store user info and tokens
5. **Redirect to frontend**

#### Token Exchange Request

```http
POST /oauth2/token HTTP/1.1
Host: mylifeuserpooldomainproduction.auth.us-east-1.amazoncognito.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=6bm3o1m4d2uva01qk2lmjjd2v1
&client_secret=t78j67k97b8v3p0o98mrd47u7rgu4mho4hmh2uqntgukr4mbshb
&code=<auth-code>
&redirect_uri=https://api.georgesheppard.dev/auth/callback
```

#### Token Exchange Response

```json
{
  "access_token": "eyJraWQiOiI...",
  "id_token": "eyJraWQiOiJ...",
  "refresh_token": "eyJjdHkiOiJ...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

#### ID Token Payload (decoded)

```json
{
  "sub": "1234567890",
  "email": "user@example.com",
  "email_verified": true,
  "cognito:username": "user@example.com",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_LuP7rq1j2",
  "aud": "6bm3o1m4d2uva01qk2lmjjd2v1",
  "exp": 1234567890,
  "iat": 1234567890,
  "nonce": "<nonce-value>"
}
```

### Response

**302 Redirect** to frontend with session cookie:

```http
HTTP/1.1 302 Found
Location: http://localhost:3000  (or oauth_redirect cookie value)
Set-Cookie: session=<encrypted-session-data>; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/
Set-Cookie: oauth_state=; Max-Age=0
Set-Cookie: oauth_nonce=; Max-Age=0
Set-Cookie: oauth_redirect=; Max-Age=0
```

Session cookie should contain:
```json
{
  "userId": "1234567890",  // sub from ID token
  "email": "user@example.com",
  "accessToken": "eyJraWQiOiI...",
  "refreshToken": "eyJjdHkiOiJ...",
  "expiresAt": 1234567890  // Unix timestamp
}
```

### Error Response

If validation fails:

```http
HTTP/1.1 302 Found
Location: http://localhost:3000?error=auth_failed
```

---

## 3. GET /auth/session

Get current authenticated user session.

### Request

```http
GET /auth/session HTTP/1.1
Host: api.georgesheppard.dev
Cookie: session=<encrypted-session-data>
```

### Response - Authenticated

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "user": {
    "id": "1234567890",
    "email": "user@example.com"
  }
}
```

### Response - Not Authenticated

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized"
}
```

### Token Refresh Logic

If access token is expired (or expiring within 5 minutes):
1. Use refresh token to get new access token from Cognito
2. Update session cookie with new tokens
3. Return user data

#### Refresh Token Request

```http
POST /oauth2/token HTTP/1.1
Host: mylifeuserpooldomainproduction.auth.us-east-1.amazoncognito.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id=6bm3o1m4d2uva01qk2lmjjd2v1
&client_secret=t78j67k97b8v3p0o98mrd47u7rgu4mho4hmh2uqntgukr4mbshb
&refresh_token=<refresh-token>
```

If refresh fails, return 401 and clear session cookie.

---

## 4. POST /auth/logout

Logout current user.

### Request

```http
POST /auth/logout HTTP/1.1
Host: api.georgesheppard.dev
Cookie: session=<encrypted-session-data>
```

### Response

```http
HTTP/1.1 200 OK
Set-Cookie: session=; Max-Age=0; Path=/

{
  "success": true,
  "cognitoLogoutUrl": "https://mylifeuserpooldomainproduction.auth.us-east-1.amazoncognito.com/logout?client_id=6bm3o1m4d2uva01qk2lmjjd2v1&logout_uri=http://localhost:3000"
}
```

### Frontend Action

Frontend should redirect to `cognitoLogoutUrl` to fully logout from Cognito:

```typescript
const response = await fetch('/auth/logout', { method: 'POST' });
const { cognitoLogoutUrl } = await response.json();
window.location.href = cognitoLogoutUrl;
```

---

## CORS Configuration

Since frontend and backend are on different domains, configure CORS:

```typescript
{
  origin: ['http://localhost:3000', 'https://my-life-nu.vercel.app'],
  credentials: true,  // Required for cookies
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}
```

---

## Session Cookie Requirements

- **Name**: `session` (or `sid`, `auth_token`, etc.)
- **HttpOnly**: `true` (prevents JavaScript access)
- **Secure**: `true` in production (HTTPS only)
- **SameSite**: `Lax` (prevents CSRF, allows redirects)
- **Max-Age**: `2592000` (30 days)
- **Path**: `/`
- **Domain**: Not set (allows cross-origin with credentials)

---

## Security Considerations

1. **Encrypt session cookie** - Use AES-256-GCM or similar
2. **Validate nonce** - Prevents replay attacks
3. **Validate state** - Prevents CSRF
4. **Verify ID token signature** - Use Cognito's JWKS endpoint
5. **Check token expiration** - Validate `exp` claim
6. **Validate audience** - Check `aud` matches client ID
7. **Validate issuer** - Check `iss` matches Cognito issuer
8. **Use HTTPS** - All production traffic must be encrypted

---

## Example Frontend Flow

```typescript
// 1. User clicks "Sign In"
window.location.href = 'https://api.georgesheppard.dev/auth/login';

// 2. After OAuth flow, user is redirected back to frontend
// 3. Frontend checks session
const response = await fetch('https://api.georgesheppard.dev/auth/session', {
  credentials: 'include'  // Send cookies
});

if (response.ok) {
  const { user } = await response.json();
  console.log('Logged in as:', user.email);
}

// 4. Sign out
const logoutResponse = await fetch('https://api.georgesheppard.dev/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
const { cognitoLogoutUrl } = await logoutResponse.json();
window.location.href = cognitoLogoutUrl;
```

---

## Recommended Libraries (Backend)

- **Express/Fastify**: Web framework
- **cookie**: Parse and serialize cookies
- **jsonwebtoken**: Verify JWT tokens
- **axios**: HTTP client for Cognito API
- **jose** or **jwks-rsa**: Verify JWT signatures with JWKS
- **crypto**: Generate random state/nonce

---

## Session Storage Options

### Option A: Encrypted Cookie (Simpler)
- Store all session data in encrypted cookie
- No server-side storage needed
- Limited by cookie size (~4KB)

### Option B: Session Store (More scalable)
- Store session ID in cookie
- Store session data in Redis/DynamoDB
- Better for large sessions or revocation
- Requires additional infrastructure

For your use case, **Option A (encrypted cookie)** is recommended for simplicity.
