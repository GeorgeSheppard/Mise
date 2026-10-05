// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { buildApiUrl } from "./index";

const env = {
  API_ORIGIN: "https://api.example.com",
  ASSETS: { fetch: vi.fn(async () => new Response("asset")) },
};

afterEach(() => {
  vi.restoreAllMocks();
  env.ASSETS.fetch.mockClear();
});

describe("buildApiUrl", () => {
  it("maps /api paths onto /admin on the API origin", () => {
    const url = buildApiUrl(new URL("https://admin.example.com/api/mise/users?x=1"), env.API_ORIGIN);
    expect(url?.toString()).toBe("https://api.example.com/admin/mise/users?x=1");
  });

  it.each(["/api/%2e%2e/mise/recipes", "/api/mise/users/a.b", "/api/"])(
    "rejects %s",
    (pathname) => {
      expect(buildApiUrl(new URL(`https://admin.example.com${pathname}`), env.API_ORIGIN)).toBeNull();
    }
  );
});

describe("worker fetch", () => {
  it("serves static assets for non-API paths", async () => {
    const response = await worker.fetch(new Request("https://admin.example.com/users/1"), env);
    expect(await response.text()).toBe("asset");
  });

  it("refuses API requests that did not come through Cloudflare Access", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await worker.fetch(new Request("https://admin.example.com/api/mise/users"), env);
    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards the Access token but not cookies", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ ok: true }, { status: 200 }));

    const response = await worker.fetch(
      new Request("https://admin.example.com/api/mise/transfer", {
        method: "POST",
        headers: {
          "cf-access-jwt-assertion": "access-jwt",
          cookie: "CF_Authorization=secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({ fromUserId: "a" }),
      }),
      env
    );

    expect(response.status).toBe(200);
    const [target, init] = fetchSpy.mock.calls[0] as [URL, RequestInit];
    expect(target.toString()).toBe("https://api.example.com/admin/mise/transfer");
    const headers = new Headers(init.headers);
    expect(headers.get("x-admin-access-jwt")).toBe("access-jwt");
    expect(headers.get("cookie")).toBeNull();
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"fromUserId":"a"}');
  });
});
