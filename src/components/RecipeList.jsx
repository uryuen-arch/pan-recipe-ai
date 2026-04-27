"use client";

export default function RecipeList({ recipes, onSelect, onRegenerate, loading }) {
  return (
    <div style={{
      background: "var(--white)", borderRadius: 16,
      border: "0.5px solid rgba(0,0,0,0.12)", overflow: "hidden",
    }}>
      {/* ヘッダー */}
      <div style={{
        background: "var(--green-pale)", padding: "10px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--green-deep)" }}>③ レシピ一覧</span>
        <span style={{ fontSize: 11, color: "var(--green-mid)" }}>{recipes.length}件見つかりました</span>
      </div>

      <div style={{ padding: "14px 16px 18px" }}>
        {recipes.map((recipe, i) => {
          const isGreen = ["ふわふわ", "しっとり"].includes(recipe.texture);
          return (
            <button
              key={i}
              onClick={() => onSelect(recipe)}
              style={{
                width: "100%", textAlign: "left", display: "block",
                border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 12,
                padding: "12px 14px", marginBottom: 10,
                background: "var(--white)", cursor: "pointer",
              }}
            >
              {/* タイトル行 */}
              <div style={{
                fontSize: 14, fontWeight: 500, color: "var(--gray-ink)",
                marginBottom: 7, display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>{recipe.name}</span>
                <span style={{ fontSize: 16, color: "var(--gray-muted)" }}>›</span>
              </div>

              {/* バッジ */}
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 10, padding: "3px 9px", borderRadius: 12,
                  background: isGreen ? "var(--green-pale)" : "var(--gray-light)",
                  color: isGreen ? "var(--green-mid)" : "var(--gray-mid)",
                }}>
                  {recipe.texture}
                </span>
                <span style={{
                  fontSize: 10, padding: "3px 9px", borderRadius: 12,
                  background: "var(--amber-pale)", color: "var(--amber-dark)",
                }}>
                  {recipe.time}
                </span>
              </div>

              {/* 材料 */}
              <div style={{ fontSize: 11, color: "var(--gray-soft)" }}>
                {recipe.ingredients.slice(0, 4).join("・")}
                {recipe.ingredients.length > 4 && ` ほか${recipe.ingredients.length - 4}点`}
              </div>
            </button>
          );
        })}

        <button onClick={onRegenerate} disabled={loading} style={{
          width: "100%", padding: 11, borderRadius: 8, marginTop: 4,
          background: "var(--white)", fontSize: 12, fontWeight: 400,
          border: "0.5px solid rgba(0,0,0,0.18)", color: "var(--gray-soft)",
          cursor: "pointer",
        }}>
          条件を変えて再生成
        </button>
      </div>
    </div>
  );
}
