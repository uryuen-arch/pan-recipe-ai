"use client";

const RANK_LABELS = ["①", "②", "③"];

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
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--green-deep)" }}>🍞 レシピ候補（{recipes.length}つ）</span>
        <span style={{ fontSize: 11, color: "var(--green-mid)" }}>タップで詳細を見る</span>
      </div>

      <div style={{ padding: "12px 16px 16px" }}>

        {/* 比較リスト */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {recipes.map((recipe, i) => (
            <button
              key={i}
              onClick={() => onSelect(recipe)}
              style={{
                width: "100%", textAlign: "left",
                border: "0.5px solid var(--gray-border)", borderRadius: 12,
                padding: "14px", background: "var(--white)", cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--green-pale)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--white)"}
            >
              {/* レシピ名 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: "var(--green-deep)", flexShrink: 0,
                }}>
                  {RANK_LABELS[i]}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-ink)" }}>
                  {recipe.name}
                </span>
              </div>

              {/* キャッチコピー */}
              {recipe.catchcopy && (
                <div style={{
                  fontSize: 12, color: "var(--green-mid)",
                  fontWeight: 500, marginBottom: 6, paddingLeft: 22,
                }}>
                  " {recipe.catchcopy} "
                </div>
              )}

              {/* feature（→ 特徴） */}
              {recipe.feature && (
                <div style={{
                  fontSize: 12, color: "var(--gray-mid)",
                  paddingLeft: 22, marginBottom: 6, lineHeight: 1.5,
                }}>
                  → {recipe.feature}
                </div>
              )}

              {/* おすすめポイント */}
              {recipe.recommend && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  marginLeft: 22,
                  background: "var(--amber-pale)", borderRadius: 20,
                  padding: "3px 10px",
                }}>
                  <span style={{ fontSize: 11 }}>👉</span>
                  <span style={{ fontSize: 11, color: "var(--amber-dark)", fontWeight: 500 }}>
                    {recipe.recommend}
                  </span>
                </div>
              )}

              {/* バッジ */}
              <div style={{ display: "flex", gap: 6, marginTop: 10, paddingLeft: 22, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 12,
                  background: "var(--green-pale)", color: "var(--green-mid)",
                }}>
                  {recipe.texture}
                </span>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 12,
                  background: "var(--amber-pale)", color: "var(--amber-dark)",
                }}>
                  {recipe.time}
                </span>
                {recipe.difficulty_level && (
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 12,
                    background: "var(--gray-light)", color: "var(--gray-mid)",
                  }}>
                    {recipe.difficulty_level}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 再生成ボタン */}
        <button
          onClick={onRegenerate}
          disabled={loading}
          style={{
            width: "100%", padding: 10, borderRadius: 10,
            background: "var(--white)", fontSize: 12,
            border: "0.5px solid var(--gray-border)", color: "var(--gray-soft)",
            cursor: "pointer",
          }}
        >
          ← 条件を変えて再生成
        </button>
      </div>
    </div>
  );
}
