import { create } from 'zustand'

export type Recipe = {
  name: string
  catchcopy: string
  feature: string
  category: string
  missing: string[]
  ingredients: string[]
  steps: string[]
  ingredientsData: any[]
  stepsData: any[]
  time: string
  servings: string
  difficulty_level: string
  method: string
  texture: string
  flourGrams: number
  recommendedProducts?: any[]
}

type Store = {
  ingredients: string[]
  conditions: string[]
  recipes: Recipe[]

  setIngredients: (data: string[]) => void
  setConditions: (data: string[]) => void
  setRecipes: (data: Recipe[]) => void
}

export const useRecipeStore = create<Store>((set) => ({
  ingredients: [],
  conditions: [],
  recipes: [],

  setIngredients: (data: string[]) => set({ ingredients: data }), // ← 配列
  setConditions: (data) => set({ conditions: data }),
  setRecipes: (data) => set({ recipes: data }),
}))