import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRightLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IRecipe } from "@/core/types/recipes";
import { api } from "../api";
import { CopyButton, QueryState } from "../components";
import { downloadJson } from "../download";

function formatQuantity({ value, unit }: IRecipe["components"][number]["ingredients"][number]["quantity"]) {
  if (value === undefined) return "";
  return unit === "none" || unit === "quantity" ? `${value}` : `${value} ${unit}`;
}

function RecipeCard({ recipe }: { recipe: IRecipe }) {
  const image = recipe.images.find((img) => img.presignedUrl);

  return (
    <Card className="gap-0 py-0">
      <details>
        <summary className="flex cursor-pointer items-center gap-4 p-4">
          {image ? (
            <img src={image.presignedUrl} alt="" className="size-14 shrink-0 rounded-md object-cover" />
          ) : (
            <div className="size-14 shrink-0 rounded-md bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-medium">{recipe.name}</div>
            <div className="truncate text-sm text-muted-foreground">{recipe.description}</div>
          </div>
          <div className="hidden gap-1 sm:flex">
            <Badge variant="outline">{recipe.components.length} components</Badge>
            <Badge variant="outline">{recipe.images.length} images</Badge>
          </div>
        </summary>
        <CardContent className="space-y-4 border-t py-4">
          <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            {recipe.uuid}
            <CopyButton value={recipe.uuid} />
          </div>
          {recipe.components.map((component) => (
            <div key={component.uuid} className="space-y-2 text-sm">
              <div className="font-medium">
                {component.name}
                {component.servings ? ` · serves ${component.servings}` : ""}
              </div>
              <ul className="list-disc pl-5">
                {component.ingredients.map((ingredient, index) => (
                  <li key={index}>
                    {formatQuantity(ingredient.quantity)} {ingredient.name}
                  </li>
                ))}
              </ul>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                {component.instructions.map((instruction, index) => (
                  <li key={index}>{instruction.text}</li>
                ))}
              </ol>
            </div>
          ))}
          {recipe.images.length > 0 && (
            <ul className="font-mono text-xs text-muted-foreground">
              {recipe.images.map((img) => (
                <li key={img.key}>{img.key}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </details>
    </Card>
  );
}

export function UserPage() {
  const { userId = "" } = useParams();
  const { data, isLoading, error } = useQuery(["user", userId], () => api.getUser(userId));

  const recipeNames = new Map(data?.recipes.map((recipe) => [recipe.uuid, recipe.name]));
  const plannedDays = data?.mealPlan.filter((day) => day.plan.length > 0) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Users
          </Link>
          <h1 className="flex items-center gap-1 font-mono text-lg">
            {userId}
            <CopyButton value={userId} />
          </h1>
        </div>
        {data && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadJson(`mise-${userId}.json`, data)}>
              <Download /> Export JSON
            </Button>
            <Button asChild>
              <Link to={`/transfer?from=${encodeURIComponent(userId)}`}>
                <ArrowRightLeft /> Transfer data
              </Link>
            </Button>
          </div>
        )}
      </div>

      <QueryState isLoading={isLoading} error={error} />

      {data && (
        <>
          <section className="space-y-3">
            <h2 className="font-serif text-xl">Recipes ({data.recipes.length})</h2>
            {data.recipes.length === 0 && <p className="text-sm text-muted-foreground">No recipes.</p>}
            {data.recipes.map((recipe) => (
              <RecipeCard key={recipe.uuid} recipe={recipe} />
            ))}
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl">Meal plan ({plannedDays.length} planned days)</h2>
            {plannedDays.length === 0 && <p className="text-sm text-muted-foreground">Nothing planned.</p>}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {plannedDays.map((day) => (
                <Card key={day.date} className="gap-2 py-4">
                  <CardContent className="space-y-1 text-sm">
                    <div className="font-medium">{format(day.date, "EEE d MMM yyyy")}</div>
                    {day.plan.map((entry, index) => (
                      <div key={index} className="text-muted-foreground">
                        {recipeNames.get(entry.recipeId) ?? (
                          <span className="font-mono text-xs">Missing recipe {entry.recipeId}</span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
