import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil, Copy, Check } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { IRecipe } from "../core/types/recipes";
import { Quantities } from "../core/recipes/units";
import { useDeleteRecipeFromDynamo } from "../core/dynamo/hooks/use_dynamo_delete";
import { ConfirmDeleteButton } from "./confirm-delete-button";

interface RecipeActionsProps {
  recipe: IRecipe;
  onClose?: () => void;
}

export function RecipeActions({ recipe, onClose }: RecipeActionsProps) {
  const navigate = useNavigate();
  const deleteRecipe = useDeleteRecipeFromDynamo();
  const [copied, setCopied] = useState(false);

  const handleEdit = () => {
    onClose?.();
    navigate(`/food/${recipe.uuid}`);
  };

  const handleCopyIngredients = async () => {
    const ingredients = recipe.components.flatMap((c) => c.ingredients);
    const text = ingredients
      .map((ing) =>
        Quantities.toStringWithIngredient(ing.name, ing.quantity)
      )
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleEdit}>
        <Pencil className="size-3.5 mr-1.5" />
        Edit
      </Button>
      <Tooltip open={copied}>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleCopyIngredients}>
            {copied ? (
              <Check className="size-3.5 mr-1.5" />
            ) : (
              <Copy className="size-3.5 mr-1.5" />
            )}
            Copy ingredients
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copied!</TooltipContent>
      </Tooltip>
      <ConfirmDeleteButton
        onDelete={async () => {
          await deleteRecipe.mutateAsync(recipe.uuid);
          onClose?.();
        }}
        disabled={deleteRecipe.disabled}
      />
    </div>
  );
}
