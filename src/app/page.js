"use client";
import { useState, useRef, useEffect } from "react";
import StepIngredients from "../components/StepIngredients";
import StepConditions from "../components/StepConditions";
import RecipeList from "../components/RecipeList";
import RecipeDetail from "../components/RecipeDetail";

// 1日あたりの生成上限
const DAILY_LIMIT = 3;
const STORAGE_KEY = "pan_recipe_usage";

// 今日の使用回数を取得
function getTodayUsage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const today = new Date().toISOString().slice(0, 10); // "2025-04-28"
    if (data.date !== today) return 0; // 日付が変わったらリセット
    return data.count || 0;
  } catch {
    return 0;
  }
}

// 使用回数を+1して保存
function incrementUsage() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const count = getTodayUsage() + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count }));
    return count;
  } catch {
    return 0;
  }
}

export default function Home() {
  const [ingredients, setIngredients] = useState("");
  const [conditions, setConditions] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showConditions, setShowConditions] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [todayCount, setTodayCount] = useState(0);

  const conditionsRef = useRef(null);
  const recipesRef = useRef(null);

  // 初期化時に今日の使用回数を読み込む
  useEffect(() => {
    setTodayCount(getTodayUsage());
  }, []);

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
    // 上限チェック
    if (todayCount >= DAILY_LIMIT) {
      setApiError(`本日の生成回数（${DAILY_LIMIT}回）に達しました。明日またお試しください。`);
      return;
    }

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

      // 成功したら使用回数を更新
      const newCount = incrementUsage();
      setTodayCount(newCount);
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

  const remaining = DAILY_LIMIT - todayCount;

  // ── メイン画面 ──
  return (
    <div style={{ background: "var(--gray-bg)", minHeight: "100vh", paddingBottom: 48 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* ヘッダー */}
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
          {/* 残り回数バッジ */}
          <span style={{
            fontSize: 11,
            color: remaining <= 1 ? "var(--amber-dark)" : "var(--green-mid)",
            background: remaining <= 1 ? "var(--amber-pale)" : "transparent",
            padding: remaining <= 1 ? "2px 8px" : "0",
            borderRadius: 20,
          }}>
            {remaining > 0
              ? `今日あと${remaining}回生成できます`
              : "本日の生成回数に達しました"}
          </span>
        </div>

        {/* ── セクション① 材料入力 ── */}
        <section style={{ marginBottom: 16 }} className="animate-fade-up">
          <StepIngredients
            value={ingredients}
            onChange={setIngredients}
            onNext={handleNext}
            onEdit={() => {
              setShowConditions(false);
              setShowRecipes(false);
              setRecipes([]);
              setConditions([]);
            }}
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
              remaining={remaining}
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
