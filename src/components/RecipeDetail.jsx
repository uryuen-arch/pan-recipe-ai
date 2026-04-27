"use client";

export default function RecipeDetail({ recipe, onBack }) {
  return (
    <div style={{ background: "var(--gray-bg)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* 詳細ヘッダー */}
        <div style={{
          background: "var(--green-pale)", padding: "11px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <button onClick={onBack} style={{
            fontSize: 11, color: "var(--green-mid)",
            border: "0.5px solid var(--green-light)", borderRadius: 20,
            padding: "4px 11px", background: "transparent",
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            ← 一覧へ
          </button>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--green-deep)" }}>
            {recipe.name}
          </span>
        </div>

        <div style={{ padding: "14px 16px 48px" }}>

          {/* 発酵時間バナー */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--amber-pale)", borderRadius: 8,
            padding: "9px 12px", marginBottom: 14,
          }}>
            <span style={{ fontSize: 15 }}>⏱</span>
            <span style={{ fontSize: 12, color: "var(--amber-dark)", fontWeight: 500 }}>
              {recipe.fermentation}
            </span>
          </div>

          {/* 材料 */}
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-mid)", marginBottom: 8 }}>
            材料
          </div>
          <div style={{
            fontSize: 12, color: "var(--gray-ink)", lineHeight: 2,
            marginBottom: 6,
          }}>
            {recipe.ingredients.map((ing, i) => (
              <div key={i}>{ing}</div>
            ))}
          </div>

          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.1)", margin: "14px 0" }} />

          {/* 作り方 */}
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-mid)", marginBottom: 8 }}>
            作り方
          </div>
          {recipe.steps.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, padding: "9px 0",
              borderBottom: "0.5px solid rgba(0,0,0,0.08)",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "var(--green-main)", color: "var(--white)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 500, flexShrink: 0, marginTop: 1,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-ink)", lineHeight: 1.65 }}>
                {step}
              </div>
            </div>
          ))}

          {/* ポイント */}
          <div style={{
            background: "var(--green-pale)", borderRadius: 8,
            padding: "11px 13px", marginTop: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--green-deep)", marginBottom: 5 }}>
              💡 ポイント
            </div>
            <p style={{ fontSize: 11, color: "var(--green-deep)", lineHeight: 1.7 }}>
              {recipe.point}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
