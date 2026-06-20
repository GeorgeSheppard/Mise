import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function CreateRecipeCard() {
  const navigate = useNavigate();

  return (
    <Card
      className="flex items-center justify-center border-2 border-dashed border-border/60 cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-colors min-h-[200px]"
      onClick={() => navigate("/food/newRecipe")}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Plus className="size-8" />
        <span className="text-sm font-medium">Create New Recipe</span>
      </div>
    </Card>
  );
}
