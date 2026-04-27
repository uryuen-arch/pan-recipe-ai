"use client";
import { useState } from "react";
import StepIngredients from "@/components/StepIngredients";
import StepConditions from "@/components/StepConditions";
import RecipeList from "@/components/RecipeList";
import RecipeDetail from "@/components/RecipeDetail";
import { useRecipeStore } from '@/store/useRecipeStore'

const STEPS = ["材料入力", "条件選択", "レシピ一覧"];

export default function Home() {
  const [step, setStep] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // 👇 Zustandから全部取る
  const {
    ingredients,
    setIngredients,
    conditions,
    setConditions,
    recipes,
    setRecipes
  } = useRecipeStore();

  const handleGenerate = async () => {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, conditions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました");

      setRecipes(data.recipes); // ← ストアに保存
      setStep(3);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (selectedRecipe) {
    return (
      <main className="min-h-screen" style={{ background: "var(--gray-bg)" }}>
        <div className="max-w-md mx-auto px-4 py-8">
          <RecipeDetail
            recipe={selectedRecipe}
            onBack={() => setSelectedRecipe(null)}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--gray-bg)" }}>
      <div className="max-w-md mx-auto px-4 py-8">

        {/* ヘッダー */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: 22 }}>🍞</span>
            <h1 className="text-lg font-bold" style={{ color: "var(--gray-ink)" }}>
              パンレシピAI
            </h1>
          </div>
          <p className="text-xs" style={{ color: "var(--gray-soft)" }}>
            手元の材料からレシピを自動生成
          </p>
        </div>

        {/* ステップUI（そのままでOK） */}

        <div
          className="rounded-2xl p-5"
          style={{
            background: "var(--white)",
            border: "1px solid var(--gray-border)",
          }}
        >
          {/* ステップ① */}
          {step === 1 && (
            <StepIngredients
              value={ingredients}
              onChange={setIngredients}
              onNext={() => setStep(2)}
            />
          )}

          {/* ステップ② */}
          {step === 2 && (
            <>
              {apiError && (
                <div
                  className="text-xs px-4 py-3 rounded-xl mb-4"
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fca5a5",
                    color: "#dc2626",
                  }}
                >
                  ⚠️ {apiError}
                </div>
              )}
              <StepConditions
                value={conditions}
                onChange={setConditions}
                onGenerate={handleGenerate}
                onBack={() => setStep(1)}
                loading={loading}
              />
            </>
          )}

          {/* ステップ③ */}
          {step === 3 && (
            <RecipeList
              recipes={recipes}
              onSelect={setSelectedRecipe}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </main>
  );
}