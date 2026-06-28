import { useState } from "react";
import { IRecipe, RecipeUuid } from "../core/types/recipes";
import { useRecipes } from "../core/dynamo/hooks/use_dynamo_get";
import { useAppSession } from "../core/hooks/use_app_session";
import { useAuth } from "@/src/auth/AuthProvider";
import { ConnectedRecipePreviewCard } from "./connected-recipe-preview-card";
import { CreateRecipeCard } from "./create-recipe-card";
import { RecipeDetailDialog } from "./recipe-detail-dialog";
import { RecipePreviewCard } from "./recipe-preview-card";
import { Skeleton } from "@/components/ui/skeleton";
import { allRecipes } from "@/lib/recipe-data";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import type { Recipe } from "@/lib/recipe-data";

interface RecipeGridProps {
  recipeIds: RecipeUuid[];
}

export function RecipeGrid({ recipeIds }: RecipeGridProps) {
  const { data: recipes, isLoading } = useRecipes();
  const session = useAppSession();
  const { signIn } = useAuth();
  const [selectedRecipe, setSelectedRecipe] = useState<IRecipe | null>(null);
  const [selectedTestRecipe, setSelectedTestRecipe] = useState<Recipe | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const recipesMap = new Map<RecipeUuid, IRecipe>();
  if (recipes) {
    for (const r of recipes) {
      recipesMap.set(r.uuid, r);
    }
  }

  const handleRecipeClick = (recipe: IRecipe) => {
    setSelectedRecipe(recipe);
    setSelectedTestRecipe(null);
    setDialogOpen(true);
  };

  const hasRealRecipes = recipes && recipes.length > 0;

  // We already have recipe data from a prior fetch, so render it straight
  // away rather than waiting on the session to resolve - the session check
  // below only matters when there's nothing to show yet.
  if (!hasRealRecipes) {
    // Show empty state if not authenticated and session has finished loading
    if (!session.loading && !session.isAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 px-4 py-12">
          <div className="flex flex-col items-center gap-2">
            <LogIn className="size-8 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Sign in to view recipes</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage your recipes after signing in.
            </p>
          </div>
          <Button
            onClick={() => signIn()}
            size="sm"
          >
            <LogIn className="size-4 mr-2" />
            Sign in
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      );
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CreateRecipeCard />
        {hasRealRecipes
          ? recipeIds.map((id) => {
              const recipe = recipesMap.get(id);
              if (!recipe) return null;
              return (
                <ConnectedRecipePreviewCard
                  key={id}
                  recipe={recipe}
                  onClick={() => handleRecipeClick(recipe)}
                />
              );
            })
          : allRecipes.map((recipe) => (
              <div
                key={recipe.title}
                onClick={() => {
                  setSelectedTestRecipe(recipe);
                  setSelectedRecipe(null);
                  setDialogOpen(true);
                }}
              >
                <RecipePreviewCard recipe={recipe} />
              </div>
            ))}
      </div>

      <RecipeDetailDialog
        recipe={selectedRecipe}
        testRecipe={selectedTestRecipe}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
