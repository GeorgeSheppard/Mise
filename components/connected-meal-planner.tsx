import { useState, useCallback, useMemo } from "react";
import {
  subDays,
  addDays,
  eachDayOfInterval,
  format,
} from "date-fns";
import { UtensilsCrossed } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipes } from "../core/dynamo/hooks/use_dynamo_get";
import { useMealPlan } from "../core/dynamo/hooks/use_dynamo_get";
import { useRecipeSearch } from "../core/recipes/hooks/use_recipe_search";
import { useSearchDebounce } from "../core/hooks/use_search_debounce";
import { usePutMealPlanToDynamo } from "../core/dynamo/hooks/use_dynamo_put";
import { iRecipeToRecipe } from "@/lib/adapters/recipe-adapter";
import {
  removeRecipeFromPlan,
  buildAddRecipePayload,
  isoToTimestamp,
} from "../core/meal_plan/meal_plan_utilities";
import type { Recipe } from "@/lib/recipe-data";
import { RecipeUuid, ComponentUuid, IRecipe } from "../core/types/recipes";
import { WeekNavigation } from "./meal-planner/week-navigation";
import { CalendarGrid } from "./meal-planner/calendar-grid";
import { RecipeSidebar } from "./meal-planner/recipe-sidebar";
import { ShoppingListDialog } from "./shopping-list-dialog";
import { RecipeDetailDialog } from "./recipe-detail-dialog";

export function ConnectedMealPlanner() {
  const [rangeStart, setRangeStart] = useState(() =>
    subDays(new Date(), 4)
  );
  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    () => new Set()
  );

  const [searchString, debouncedSearch, setSearchString] = useSearchDebounce("");
  const [selectedRecipe, setSelectedRecipe] = useState<IRecipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: recipes, isLoading: recipesLoading } = useRecipes();
  const searchResultIds = useRecipeSearch(debouncedSearch);
  const mealPlan = useMealPlan();
  const putMealPlan = usePutMealPlanToDynamo();

  // Build image URL map from presigned URLs included in recipe data
  const imageUrls = useMemo(() => {
    const urls = new Map<RecipeUuid, string>();
    if (recipes) {
      for (const recipe of recipes) {
        const url = recipe.images?.[0]?.presignedUrl;
        if (url) {
          urls.set(recipe.uuid, url);
        }
      }
    }
    return urls;
  }, [recipes]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: rangeStart,
        end: addDays(rangeStart, 14),
      }),
    [rangeStart]
  );

  // Build recipes map for quick lookup
  const recipesMap = useMemo(() => {
    const map = new Map<RecipeUuid, IRecipe>();
    if (recipes) {
      for (const r of recipes) {
        map.set(r.uuid, r);
      }
    }
    return map;
  }, [recipes]);

  // Filter meal plan to current week
  const weekPlan = useMemo(() => {
    if (!mealPlan.data) return [];
    const weekTimestamps = new Set(days.map((d) => isoToTimestamp(format(d, "yyyy-MM-dd"))));
    return mealPlan.data.filter((item) => weekTimestamps.has(item.date));
  }, [mealPlan.data, days]);

  // Count total meals for the week
  const weekMealCount = useMemo(() => {
    return weekPlan.reduce((count, day) => count + day.plan.length, 0);
  }, [weekPlan]);

  // Build sidebar recipe list (v0 format), filtered by search
  const sidebarRecipes = useMemo(() => {
    if (!recipes) return [];
    const ids = new Set(searchResultIds);
    return recipes
      .filter((r) => ids.has(r.uuid))
      .map((r) => iRecipeToRecipe(r, imageUrls.get(r.uuid)));
  }, [recipes, imageUrls, searchResultIds]);

  // Map v0 Recipe title back to IRecipe for meal plan operations
  const recipeByTitle = useMemo(() => {
    const map = new Map<string, IRecipe>();
    if (recipes) {
      for (const r of recipes) {
        map.set(r.name, r);
      }
    }
    return map;
  }, [recipes]);

  const handlePreviousWeek = useCallback(() => {
    setRangeStart((prev) => subDays(prev, 7));
  }, []);

  const handleNextWeek = useCallback(() => {
    setRangeStart((prev) => addDays(prev, 7));
  }, []);

  const handleToday = useCallback(() => {
    setRangeStart(subDays(new Date(), 4));
  }, []);

  const handleToggleDate = useCallback((dateStr: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  }, []);

  const handleDrop = useCallback(
    (recipe: Recipe, date: string) => {
      const iRecipe = recipeByTitle.get(recipe.title);
      if (!iRecipe) return;
      const payload = buildAddRecipePayload(iRecipe, date);
      putMealPlan.mutate(payload);
    },
    [recipeByTitle, putMealPlan]
  );

  const handleRemoveMeal = useCallback(
    (recipeId: RecipeUuid, timestamp: number) => {
      if (!mealPlan.data) return;
      const updatedPlan = removeRecipeFromPlan(mealPlan.data, recipeId, timestamp);
      putMealPlan.mutatePlan(updatedPlan);
    },
    [putMealPlan, mealPlan.data]
  );

  const handleUpdateComponentServings = useCallback(
    (recipeId: RecipeUuid, componentId: ComponentUuid, timestamp: number, newServings: number) => {
      // Find the day and recipe in the meal plan
      const dateItem = weekPlan.find((item) => item.date === timestamp);
      if (!dateItem) return;
      const recipe = dateItem.plan.find((r) => r.recipeId === recipeId);
      if (!recipe) return;
      const component = recipe.components.find((c) => c.componentId === componentId);
      if (!component) return;

      const delta = newServings - component.servings;
      putMealPlan.mutate({
        timestamp,
        components: [{
          recipeId,
          componentId,
          servingsIncrease: delta,
        }],
      });
    },
    [weekPlan, putMealPlan]
  );

  const handleRecipeClick = useCallback(
    (recipe: Recipe) => {
      const iRecipe = recipeByTitle.get(recipe.title);
      if (!iRecipe) return;
      setSelectedRecipe(iRecipe);
      setDialogOpen(true);
    },
    [recipeByTitle]
  );

  const isLoading = recipesLoading || mealPlan.isInitialLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="hidden lg:flex lg:gap-6">
          <Skeleton className="h-[60vh] w-[280px] shrink-0 rounded-xl" />
          <Skeleton className="h-[60vh] flex-1 rounded-xl" />
        </div>
        <div className="flex flex-col gap-6 lg:hidden">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-[60vh] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-4 -mt-4 pt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <UtensilsCrossed className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-serif text-2xl tracking-tight text-foreground">
                Meal Planner
              </h2>
              <p className="text-sm text-muted-foreground">
                {weekMealCount === 0
                  ? "Drag recipes onto the calendar to plan your week"
                  : `${weekMealCount} meal${weekMealCount === 1 ? "" : "s"} planned this week`}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <WeekNavigation
              weekStart={rangeStart}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
              onToday={handleToday}
            />
            <ShoppingListDialog selectedDates={selectedDates} />
          </div>
        </div>
      </div>

      {/* Desktop: side-by-side layout with independent scrolling */}
      <div className="hidden lg:flex lg:gap-6">
        <aside className="w-[280px] shrink-0 overflow-y-auto max-h-[calc(100vh-14rem)]">
          <RecipeSidebar recipes={sidebarRecipes} searchString={searchString} onSearchChange={setSearchString} onRecipeClick={handleRecipeClick} />
        </aside>
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[calc(100vh-14rem)]">
          <CalendarGrid
            days={days}
            plan={weekPlan}
            recipes={recipesMap}
            selectedDates={selectedDates}
            onToggleDate={handleToggleDate}
            onDrop={handleDrop}
            onUpdateComponentServings={handleUpdateComponentServings}
            onRemoveMeal={handleRemoveMeal}
          />
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex flex-col gap-6 lg:hidden">
        <RecipeSidebar recipes={sidebarRecipes} searchString={searchString} onSearchChange={setSearchString} onRecipeClick={handleRecipeClick} />
        <CalendarGrid
          days={days}
          plan={weekPlan}
          recipes={recipesMap}
          selectedDates={selectedDates}
          onToggleDate={handleToggleDate}
          onDrop={handleDrop}
          onUpdateComponentServings={handleUpdateComponentServings}
          onRemoveMeal={handleRemoveMeal}
        />
      </div>

      <RecipeDetailDialog
        recipe={selectedRecipe}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
