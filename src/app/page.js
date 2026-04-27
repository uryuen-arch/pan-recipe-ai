"use client";
import { useState } from "react";
import StepIngredients from "@/components/StepIngredients";
import StepConditions from "@/components/StepConditions";
import RecipeList from "@/components/RecipeList";
import RecipeDetail from "@/components/RecipeDetail";
import { useRecipeStore } from '@/store/useRecipeStore'

const STEPS = ["材料入力", "条件選択", "レシピ一覧"];

export default function Home() {
  const [step, setStep] = useState(1);           // 1 | 2 | 3
  const { ingredients, setIngredients } = useRecipeStore();
  const [conditions, setConditions] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

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
      setRecipes(data.recipes);
      setStep(3);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 詳細画面
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

        {/* ステップインジケーター */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center mb-2">
            {STEPS.map((label, i) => {
              const num = i + 1;
              const isDone   = step > num;
              const isActive = step === num;
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all"
                      style={{
                        background: isDone
                          ? "var(--green-light)"
                          : isActive
                          ? "var(--green-main)"
                          : "#e8e7e0",
                        color: isDone
                          ? "var(--green-deep)"
                          : isActive
                          ? "var(--white)"
                          : "var(--gray-soft)",
                      }}
                    >
                      {isDone ? "✓" : num}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-px mx-1 transition-all"
                      style={{
                        background: step > i + 1
                          ? "var(--green-light)"
                          : "var(--gray-border)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between">
            {STEPS.map((label, i) => (
              <span
                key={i}
                className="text-xs"
                style={{
                  color: step === i + 1 ? "var(--green-main)" : "var(--gray-muted)",
                  fontWeight: step === i + 1 ? 500 : 400,
                  flex: i < STEPS.length - 1 ? 1 : "none",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* カード */}
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
