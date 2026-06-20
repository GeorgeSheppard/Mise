import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { X, Save } from "lucide-react";
import { IRecipe } from "../core/types/recipes";
import { useParsedRecipeToDynamo } from "../core/dynamo/hooks/use_parse_recipe";
import { recipeToString, isNewRecipe } from "../core/utils/recipe_formatter";

interface RecipeEditorProps {
  recipe: IRecipe;
}

export function RecipeEditor({ recipe }: RecipeEditorProps) {
  const navigate = useNavigate();
  const parsedRecipe = useParsedRecipeToDynamo();

  const [text, setText] = useState(() => {
    if (isNewRecipe(recipe)) return "";
    return recipeToString(recipe);
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await parsedRecipe.mutateAsync(text, recipe.uuid);
      navigate("/food");
    } catch (error) {
      console.error("Error saving recipe:", error);
      setSaving(false);
    }
  };

  const handleExit = () => {
    navigate("/food");
  };

  return (
    <Card className="mx-auto max-w-3xl border-border/60 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-foreground">
            {isNewRecipe(recipe) ? "New Recipe" : "Edit Recipe"}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleExit}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your recipe here. Include ingredients, quantities, and instructions..."
          className="min-h-[400px] resize-y text-sm leading-relaxed"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleExit}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !text.trim()}>
            {saving ? (
              <Spinner className="size-4 mr-2" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Save Recipe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
