export interface Ingredient {
  name: string
  amount: string
  unit?: string
}

export interface RecipePart {
  title: string
  ingredients: Ingredient[]
  instructions: string[]
}

export interface Recipe {
  title: string
  description: string
  image: string
  prepTime: string
  cookTime: string
  totalTime: string
  servings: string
  difficulty?: "Easy" | "Medium" | "Hard"
  tags: string[]
  parts: RecipePart[]
  notes?: string[]
}
