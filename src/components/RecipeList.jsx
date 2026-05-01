"use client";

const CATEGORY_CONFIG = {
  perfect: { label: "✅ 今すぐ作れる",       color: "var(--green-main)", bg: "var(--green-pale)", text: "var(--green-deep)" },
  almost:  { label: "🟡 あとこれがあれば",   color: "#d97706",           bg: "#fef9c3",           text: "#92400e" },
  lacking: { label: "❌ 材料が足りない",      color: "var(--gray-soft)",  bg: "var(--gray-light)", text: "var(--gray-mid)" },
};

const RANK_LABELS = ["①", "②", "③"];

export default function RecipeList({ recipes, onSelect, onRegenerate, loading }) {
  // カテゴリ別にグループ化
  const grouped = {
    perfect: recipes.filter(r => r.category === "perfect"),
    almost:  recipes.filter(r => r.category === "almost"),
    lacking: recipes.filter(r => r.category === "lacking"),
  };

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
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--green-deep)" }}>
          🍞 レシピ候補
        </span>
        <span style={{ fontSize: 11, color: "var(--green-mid)" }}>
          タップで詳細を見る
        </span>
      </div>

      <div style={{ padding: "12px 16px 16px" }}>
        {["perfect", "almost", "lacking"].map(cat => {
          const items = grouped[cat];
          if (items.length === 0) return null;
          const config = CATEGORY_CONFIG[cat];

          return (
            <div key={cat} style={{ marginBottom: 16 }}>
              {/* カテゴリラベル */}
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: config.text,
                marginBottom: 8,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {config.label}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((recipe, i) => {
                  const globalIndex = recipes.indexOf(recipe);
                  return (
                    <button
                      key={i}
                      onClick={() => onSelect(recipe)}
                      style={{
                        width: "100%", textAlign: "left",
                        border: `0.5px solid ${cat === "perfect" ? "var(--green-light)" : "var(--gray-border)"}`,
                        borderRadius: 12, padding: "12px 14px",
                        background: "var(--white)", cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = config.bg}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--white)"}
                    >
                      {/* レシピ名 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green-deep)", flexShrink: 0 }}>
                          {RANK_LABELS[globalIndex] || `${globalIndex + 1}`}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-ink)" }}>
                          {recipe.name}
                        </span>
                      </div>

                      {/* キャッチコピー */}
                      {recipe.catchcopy && (
                        <div style={{ fontSize: 11, color: "var(--green-mid)", fontStyle: "italic", marginBottom: 5, paddingLeft: 22 }}>
                          " {recipe.catchcopy} "
                        </div>
                      )}

                      {/* feature */}
                      {recipe.feature && (
                        <div style={{ fontSize: 11, color: "var(--gray-mid)", paddingLeft: 22, marginBottom: 6 }}>
                          → {recipe.feature}
                        </div>
                      )}

                      {/* 不足材料（almostのみ） */}
                      {cat === "almost" && recipe.missing?.length > 0 && (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          marginLeft: 22, marginBottom: 6,
                          background: "#fef9c3", borderRadius: 20,
                          padding: "3px 10px",
                        }}>
                          <span style={{ fontSize: 11, color: "#92400e" }}>
                            🛒 {recipe.missing.join("・")}があれば作れます
                          </span>
                        </div>
                      )}

                      {/* 代替材料 */}
                      {recipe.substituteNote && (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          marginLeft: 22, marginBottom: 6,
                          background: "var(--green-pale)", borderRadius: 20,
                          padding: "3px 10px",
                        }}>
                          <span style={{ fontSize: 11, color: "var(--green-deep)" }}>
                            💡 {recipe.substituteNote}
                          </span>
                        </div>
                      )}

                      {/* バッジ */}
                      <div style={{ display: "flex", gap: 6, marginTop: 8, paddingLeft: 22, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: "var(--green-pale)", color: "var(--green-mid)" }}>
                          {recipe.texture}
                        </span>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: "var(--amber-pale)", color: "var(--amber-dark)" }}>
                          {recipe.time}
                        </span>
                        {recipe.profileType && (
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: "var(--gray-light)", color: "var(--gray-mid)" }}>
                            {recipe.profileType}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 再生成ボタン */}
        <button
          onClick={onRegenerate}
          disabled={loading}
          style={{
            width: "100%", padding: 10, borderRadius: 10, marginTop: 4,
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
