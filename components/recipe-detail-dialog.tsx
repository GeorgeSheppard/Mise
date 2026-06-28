import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecipeCard } from "./recipe-card";
import { RecipeActions } from "./recipe-actions";
import { IRecipe } from "../core/types/recipes";
import { iRecipeToRecipe } from "@/lib/adapters/recipe-adapter";
import { useRecipeImage } from "@/lib/adapters/use-recipe-image";

interface RecipeDetailDialogProps {
  recipe: IRecipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailDialog({
  recipe,
  open,
  onOpenChange,
}: RecipeDetailDialogProps) {
  const imageUrl = useRecipeImage(recipe?.images);

  const v0Recipe = recipe ? iRecipeToRecipe(recipe, imageUrl) : null;

  if (!v0Recipe) return null;

  const actions = recipe ? (
    <RecipeActions
      recipe={recipe}
      onClose={() => onOpenChange(false)}
    />
  ) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <DialogTitle className="font-serif text-lg">
            {v0Recipe.title}
          </DialogTitle>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
          <div className="p-1">
            <RecipeCard recipe={v0Recipe} actions={actions} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
