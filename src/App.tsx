import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { useHydrateCacheFromIndexedDb } from "@/core/storage/use_hydrate_cache_from_indexed_db";

// Lazy load route components for code splitting
const RecipesPage = lazy(() => import("./pages/food/RecipesPage"));
const RecipeFormPage = lazy(() => import("./pages/food/RecipeFormPage"));
const MealPlannerPage = lazy(() => import("./pages/food/MealPlannerPage"));

export function App() {
  // Seed the query cache from IndexedDB so recipes/meal plan can render
  // instantly, before auth has resolved or the network request completes.
  useHydrateCacheFromIndexedDb();

  return (
    <AppLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Routes>
          {/* Redirect / to /food */}
          <Route path="/" element={<Navigate to="/food" replace />} />

          {/* Food routes */}
          <Route path="/food" element={<RecipesPage />} />
          <Route path="/food/:recipeUuid" element={<RecipeFormPage />} />
          <Route path="/food/meal-planner" element={<MealPlannerPage />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}
