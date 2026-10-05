interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  API_ORIGIN: string;
}

const API_PATH = /^\/api\/[A-Za-z0-9/_-]+$/;

export function buildApiUrl(requestUrl: URL, apiOrigin: string): URL | null {
  if (!API_PATH.test(requestUrl.pathname)) {
    return null;
  }

  const target = new URL(requestUrl.pathname.replace(/^\/api\//, "/admin/"), apiOrigin);
  target.search = requestUrl.search;
  return target.pathname.startsWith("/admin/") ? target : null;
}

export async function proxyToApi(request: Request, env: Env): Promise<Response> {
  // Cloudflare Access adds this header after authenticating the request; without it the
  // Worker has been reached some other way, so refuse rather than forward anything.
  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!accessJwt) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = buildApiUrl(new URL(request.url), env.API_ORIGIN);
  if (!target) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Only forward what the API needs: never the browser's cookies (including CF_Authorization)
  const headers = new Headers({ "X-Admin-Access-Jwt": accessJwt, Accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      return proxyToApi(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
