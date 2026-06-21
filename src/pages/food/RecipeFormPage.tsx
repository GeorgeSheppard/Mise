import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useRecipe } from "@/core/dynamo/hooks/use_dynamo_get";
import { RecipeUuid } from "@/core/types/recipes";
import { RecipeEditor } from "@/components/recipe-editor";
import { Skeleton } from "@/components/ui/skeleton";

export const NewRecipe = "newRecipe";

const getDefaultRecipe = (uuid: string) => ({
  uuid,
  name: "",
  description: "",
  images: [],
  components: [
    {
      name: "",
      ingredients: [],
      instructions: [],
      storeable: false,
      uuid: uuidv4(),
      servings: 1,
    },
  ],
});

export default function RecipeFormPage() {
  const { recipeUuid } = useParams<{ recipeUuid: string }>();
  const navigate = useNavigate();
  const uuid = recipeUuid as RecipeUuid | undefined;
  const recipe = useRecipe(uuid);

  if (!uuid) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  if (uuid === NewRecipe) {
    return (
      <main className="px-4 py-6 sm:px-6">
        <RecipeEditor recipe={getDefaultRecipe(uuidv4())} />
      </main>
    );
  }

  if (recipe.isError) {
    console.error("Error: ", recipe.error);
    navigate("/food");
    return null;
  }

  if (recipe.isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  if (!recipe.data) {
    console.error(`Error: ${uuid} doesn't exist`);
    navigate("/food");
    return null;
  }

  return (
    <main className="px-4 py-6 sm:px-6">
      <RecipeEditor recipe={recipe.data} />
    </main>
  );
}
