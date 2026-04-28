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


  /*ダミーデータ（APIの代わり）
  await new Promise((r) => setTimeout(r, 1200)); // ローディング演出
  setRecipes([
    {
      name: "ふわふわミルクブレッド",
      texture: "ふわふわ",
      time: "約60分",
      ingredients: ["強力粉 200g", "牛乳 130ml", "バター 20g", "砂糖 大さじ2", "ドライイースト 3g", "塩 小さじ1/2"],
      steps: [
        "ボウルに強力粉・砂糖・塩・イーストを入れ軽く混ぜ、牛乳を加えてひとまとめにする",
        "バターを加えてなめらかになるまで約10分こねる",
        "ラップをかけ温かい場所で40分一次発酵させる",
        "4等分にして丸め直し、20分二次発酵後に200℃で12分焼く",
      ],
      fermentation: "一次発酵 40分 / 二次発酵 20分",
      point: "牛乳は人肌程度に温めるとイーストが活性化しやすくなります。表面がつるっとするまでしっかりこねましょう。",
    },
    {
      name: "しっとりバターロール",
      texture: "しっとり",
      time: "約45分",
      ingredients: ["強力粉 180g", "バター 30g", "牛乳 120ml", "砂糖 大さじ1", "塩 小さじ1/2", "ドライイースト 2g"],
      steps: [
        "材料をすべてボウルに入れてまとめ、なめらかになるまでこねる",
        "一次発酵させる（30分）",
        "6等分にして成形し、二次発酵（15分）後に180℃で13分焼く",
      ],
      fermentation: "一次発酵 30分 / 二次発酵 15分",
      point: "バターをしっかり生地に練り込むことでしっとりとした食感になります。",
    },
    {
      name: "時短ちぎりパン",
      texture: "ふわふわ",
      time: "約30分",
      ingredients: ["強力粉 150g", "牛乳 100ml", "バター 15g", "砂糖 小さじ2", "ドライイースト 3g"],
      steps: [
        "全材料を混ぜてひとまとめにし、5分こねる",
        "一次発酵なしで8等分して型に並べる",
        "二次発酵10分後、190℃で15分焼く",
      ],
      fermentation: "一次発酵 なし / 二次発酵 10分",
      point: "イーストを多めにすることで発酵時間を短縮できます。焼きたてをちぎって食べるのがおすすめです。",
    },
  ]);
  setShowRecipes(true);
  setLoading(false);
};

 ダミーデータここまで（APIの代わり）*/

    //　APIを使うときは有効化
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
  //有効化ここまで  
  

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
