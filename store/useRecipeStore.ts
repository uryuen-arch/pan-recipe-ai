import { create } from 'zustand'

type Recipe = {
  title: string
  ingredients: string[]
  steps: string[]
  time?: string
}

type Store = {
  ingredients: string
  conditions: string[]
  recipes: Recipe[]

  setIngredients: (data: string) => void
  setConditions: (data: string[]) => void
  setRecipes: (data: Recipe[]) => void
}

export const useRecipeStore = create<Store>((set) => ({
  ingredients: "",
  conditions: [],
  recipes: [],

  setIngredients: (data: string) => set({ ingredients: data }),
  setConditions: (data) => set({ conditions: data }),
  setRecipes: (data) => set({ recipes: data }),
}))