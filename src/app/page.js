"use client";
import { useState, useRef, useEffect } from "react";
import StepIngredients from "../components/StepIngredients";
import StepConditions from "../components/StepConditions";
import RecipeList from "../components/RecipeList";
import RecipeDetail from "../components/RecipeDetail";

export default function Home() {
  const [ingredients, setIngredients] = useState("");
  const [conditions, setConditions] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showConditions, setShowConditions] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);

  const conditionsRef = useRef(null);
  const recipesRef = useRef(null);

  useEffect(() => {
    if (showConditions && conditionsRef.current) {
      setTimeout(() => conditionsRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [showConditions]);

  useEffect(() => {
    if (showRecipes && recipesRef.current) {
      setTimeout(() => recipesRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [showRecipes]);

  const handleNext = () => setShowConditions(true);

  const handleGenerate = async () => {
    setLoading(true);
    setApiError("");
    setShowRecipes(false);
    setRecipes([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, conditions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました");
      setRecipes(data.recipes);
      setShowRecipes(true);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 詳細画面 ──
  if (selectedRecipe) {
    return (
      <div style={{ background: "var(--gray-bg)", minHeight: "100vh" }}>
        <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
      </div>
    );
  }

  // ── メイン画面 ──
  return (
    <div style={{ background: "var(--gray-bg)", minHeight: "100vh", paddingBottom: 48 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* ヘッダー（ステータスバー風） */}
        <div style={{
          background: "var(--green-pale)",
          margin: "0 -16px",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--green-deep)" }}>🍞 パンレシピAI</span>
          <span style={{ fontSize: 11, color: "var(--green-mid)" }}>材料を入れてレシピ作成</span>
        </div>

        {/* ── セクション① 材料入力 ── */}
        <section style={{ marginBottom: 16 }} className="animate-fade-up">
          <StepIngredients
            value={ingredients}
            onChange={setIngredients}
            onNext={handleNext}
            done={showConditions}
          />
        </section>

        {/* ── セクション② 条件選択 ── */}
        {showConditions && (
          <section ref={conditionsRef} style={{ marginBottom: 16, scrollMarginTop: 16 }} className="animate-fade-up">
            {apiError && (
              <div style={{
                fontSize: 12, padding: "10px 14px", borderRadius: 8, marginBottom: 12,
                background: "#fef2f2", border: "0.5px solid #fca5a5", color: "#dc2626",
              }}>
                ⚠️ {apiError}
              </div>
            )}
            <StepConditions
              value={conditions}
              onChange={setConditions}
              onGenerate={handleGenerate}
              loading={loading}
            />
          </section>
        )}

        {/* ── セクション③ レシピ一覧 ── */}
        {showRecipes && recipes.length > 0 && (
          <section ref={recipesRef} style={{ scrollMarginTop: 16 }} className="animate-fade-up">
            <RecipeList
              recipes={recipes}
              onSelect={setSelectedRecipe}
              onRegenerate={handleGenerate}
              loading={loading}
            />
          </section>
        )}

      </div>
    </div>
  );
}
