"use client";
import { useState, useRef, useEffect } from "react";
import StepIngredients from "../components/StepIngredients";
import StepConditions from "../components/StepConditions";
import RecipeList from "../components/RecipeList";
import RecipeDetail from "../components/RecipeDetail";
import HamburgerMenu from "../components/HamburgerMenu";
import FavoriteList from "../components/FavoriteList";

const DAILY_LIMIT = 3;
const STORAGE_KEY = "pan_recipe_usage";

function getTodayUsage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const today = new Date().toISOString().slice(0, 10);
    if (data.date !== today) return 0;
    return data.count || 0;
  } catch { return 0; }
}

function incrementUsage() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const count = getTodayUsage() + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count }));
    return count;
  } catch { return 0; }
}

export default function Home() {
  const [page, setPage] = useState("home"); // "home" | "favorites"
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

  useEffect(() => { setTodayCount(getTodayUsage()); }, []);

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
    /*生成回数制限を解除中　StepConditionsのボタンも連動
    if (todayCount >= DAILY_LIMIT) {
      setApiError(`本日の生成回数（${DAILY_LIMIT}回）に達しました。明日またお試しください。`);
      return;
    }
      ここまで*/
    setLoading(true);
    setApiError("");
    setShowRecipes(false);
    setRecipes([]);
/*ダミー
      await new Promise((r) => setTimeout(r, 1000));

  setRecipes([
    {
      name: "ふわふわミルクブレッド",
      texture: "ふんわり",
      time: "約60分",
      servings: "4個分",
      sweetness: "甘め",
      difficulty_level: "簡単",
      catchcopy: "牛乳たっぷりでしっとりふんわり仕上げ",
      feature: "甘め・しっとり・牛乳使用",
      recommend: "一番簡単",
      ingredients: ["強力粉 200g", "牛乳 130ml", "バター 20g", "砂糖 大さじ2", "ドライイースト 3g", "塩 小さじ1/2"],
      steps: ["【下準備】バターは室温に戻す", "【捏ね①】粉類を混ぜる", "【捏ね②】牛乳を加えてまとめる", "【一次発酵】28℃で40分", "【成形】4等分にして丸める", "【二次発酵】35℃で20分", "【焼成】180℃で15分", "【仕上げ】網の上で冷ます"],
      fermentation: "一次発酵 28℃・40分 / 二次発酵 35℃・20分",
      point: "牛乳は人肌程度に温めると発酵が安定します。",
    },
  ]);
  setShowRecipes(true);
  setLoading(false);
};
 ダミー */
    //　生成AI使えるようになったら有効化（API使えないときは、ダミーで凌ぐ
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
      const newCount = incrementUsage();
      setTodayCount(newCount);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };
  //ここまで有効化

  const remaining = DAILY_LIMIT - todayCount;

  // ── 詳細画面 ──
  if (selectedRecipe) {
    return (
      <div style={{ background: "var(--gray-bg)", minHeight: "100vh" }}>
        <RecipeDetail
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--gray-bg)", minHeight: "100vh", paddingBottom: 48 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* ヘッダー */}
        <div style={{
          background: "var(--green-pale)",
          margin: "0 -16px",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--green-deep)" }}>
            🍞 パンレシピAI
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {page === "home" && (
              <span style={{
                fontSize: 11,
                color: remaining <= 1 ? "var(--amber-dark)" : "var(--green-mid)",
                background: remaining <= 1 ? "var(--amber-pale)" : "transparent",
                padding: remaining <= 1 ? "2px 8px" : "0",
                borderRadius: 20,
              }}>
                {remaining > 0 ? `今日あと${remaining}回` : "本日の上限に達しました"}
              </span>
            )}
            <HamburgerMenu currentPage={page} onNavigate={setPage} />
          </div>
        </div>

        {/* ── お気に入りページ ── */}
        {page === "favorites" && (
          <div className="animate-fade-up">
            <div style={{
              fontSize: 14, fontWeight: 500, color: "var(--gray-ink)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 6,
            }}>
              ❤️ お気に入りレシピ
            </div>
            <FavoriteList onSelect={setSelectedRecipe} />
          </div>
        )}

        {/* ── ホームページ ── */}
        {page === "home" && (
          <>
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
          </>
        )}

      </div>
    </div>
  );
}
