import { SearchBar } from "@/components/search-bar";
import { RecipeGrid } from "@/components/recipe-grid";
import { useRecipeSearch } from "@/core/recipes/hooks/use_recipe_search";
import { useSearchDebounce } from "@/core/hooks/use_search_debounce";

export default function RecipesPage() {
  const [searchString, debouncedValue, setSearchString] =
    useSearchDebounce("");
  const searchResults = useRecipeSearch(debouncedValue);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4">
        <SearchBar
          searchString={searchString}
          onSearchChange={setSearchString}
        />
        <RecipeGrid recipeIds={searchResults} />
      </div>
    </main>
  );
}
