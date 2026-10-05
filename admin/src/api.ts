import { IRecipe } from "@/core/types/recipes";
import { IMealPlan } from "@/core/types/meal_plan";

export interface MiseUserSummary {
  userId: string;
  recipeCount: number;
  hasMealPlan: boolean;
}

export interface MiseUser {
  userId: string;
  recipes: IRecipe[];
  mealPlan: IMealPlan;
}

export interface TransferRequest {
  fromUserId: string;
  toUserId: string;
  recipeUuids?: string[];
  includeMealPlan: boolean;
}

export interface TransferResult {
  recipesCopied: number;
  imagesCopied: number;
  mealPlanCopied: boolean;
}

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  // An expired Access session answers with a login redirect/HTML page rather than JSON
  const isJson = response.headers.get("content-type")?.includes("application/json");
  if (!isJson) {
    throw new ApiError("Your Cloudflare Access session has expired. Reload the page to sign in again.", response.status);
  }

  const body = await response.json();
  if (!response.ok) {
    throw new ApiError(body?.error ?? `Request failed (${response.status})`, response.status);
  }
  return body as T;
}

export const api = {
  listUsers: () => request<{ users: MiseUserSummary[] }>("/mise/users"),
  getUser: (userId: string) => request<MiseUser>(`/mise/users/${encodeURIComponent(userId)}`),
  transfer: (body: TransferRequest) =>
    request<TransferResult>("/mise/transfer", { method: "POST", body: JSON.stringify(body) }),
};
