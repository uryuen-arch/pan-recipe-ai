"use client";

export default function RecipeDetail({ recipe, onBack }) {
  return (
    <div style={{ background: "var(--gray-bg)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* ヘッダー */}
        <div style={{
          background: "var(--green-pale)", padding: "11px 14px",
          display: "flex", alignItems: "center", gap: 10,
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <button onClick={onBack} style={{
            fontSize: 11, color: "var(--green-mid)",
            border: "0.5px solid var(--green-light)", borderRadius: 20,
            padding: "4px 11px", background: "transparent",
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            ← 一覧へ
          </button>
          <span style={{
            fontSize: 13, fontWeight: 500, color: "var(--green-deep)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {recipe.name}
          </span>
        </div>

        <div style={{ padding: "16px 16px 64px" }}>

          {/* バッジ行 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {recipe.texture && (
              <span style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 12,
                background: "var(--green-pale)", color: "var(--green-mid)",
              }}>{recipe.texture}</span>
            )}
            {recipe.time && (
              <span style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 12,
                background: "var(--amber-pale)", color: "var(--amber-dark)",
              }}>{recipe.time}</span>
            )}
            {recipe.servings && (
              <span style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 12,
                background: "var(--gray-light)", color: "var(--gray-mid)",
              }}>{recipe.servings}</span>
            )}
          </div>

          {/* 発酵時間バナー */}
          {recipe.fermentation && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--amber-pale)", borderRadius: 8,
              padding: "10px 14px", marginBottom: 16,
            }}>
              <span style={{ fontSize: 16 }}>⏱</span>
              <div>
                <div style={{ fontSize: 10, color: "var(--amber-dark)", marginBottom: 2 }}>発酵時間</div>
                <div style={{ fontSize: 12, color: "var(--amber-dark)", fontWeight: 500 }}>
                  {recipe.fermentation}
                </div>
              </div>
            </div>
          )}

          {/* 材料 */}
          <Section title="材料" emoji="🧂">
            <div style={{
              background: "var(--white)", borderRadius: 10,
              border: "0.5px solid var(--gray-border)", overflow: "hidden",
            }}>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} style={{
                  padding: "10px 14px", fontSize: 13,
                  borderBottom: i < recipe.ingredients.length - 1
                    ? "0.5px solid var(--gray-border)" : "none",
                  background: i % 2 === 0 ? "var(--white)" : "var(--gray-bg)",
                  color: "var(--gray-ink)", lineHeight: 1.5,
                }}>
                  {ing}
                </div>
              ))}
            </div>
          </Section>

          {/* 作り方 */}
          <Section title="作り方" emoji="👨‍🍳">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recipe.steps.map((step, i) => {
                // 【】で始まる見出しを太字に
                const isHeading = step.startsWith("【");
                const headingMatch = step.match(/^【(.+?)】(.*)$/s);

                return (
                  <div key={i} style={{
                    display: "flex", gap: 12,
                    background: "var(--white)", borderRadius: 10,
                    padding: "12px 14px",
                    border: "0.5px solid var(--gray-border)",
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: "var(--green-main)", color: "var(--white)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      {headingMatch ? (
                        <>
                          <div style={{
                            fontSize: 12, fontWeight: 600,
                            color: "var(--green-deep)", marginBottom: 4,
                          }}>
                            {headingMatch[1]}
                          </div>
                          {headingMatch[2] && (
                            <div style={{ fontSize: 13, color: "var(--gray-ink)", lineHeight: 1.7 }}>
                              {headingMatch[2].trim()}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: 13, color: "var(--gray-ink)", lineHeight: 1.7 }}>
                          {step}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ポイント */}
          {recipe.point && (
            <Section title="ポイント" emoji="💡">
              <div style={{
                background: "var(--green-pale)", borderRadius: 10,
                padding: "14px", border: "0.5px solid var(--green-light)",
              }}>
                <p style={{ fontSize: 13, color: "var(--green-deep)", lineHeight: 1.8 }}>
                  {recipe.point}
                </p>
              </div>
            </Section>
          )}

          {/* フィードバック */}
          <div style={{
            border: "0.5px solid var(--gray-border)", borderRadius: 12,
            padding: "16px", marginTop: 8, marginBottom: 8,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 16, marginBottom: 6 }}>📝</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-ink)", marginBottom: 4 }}>
              このレシピどうでしたか？
            </div>
            <div style={{ fontSize: 11, color: "var(--gray-soft)", marginBottom: 12 }}>
              ご意見・ご感想をお聞かせください
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSc-d07wzgD6k2VnNzhty6Bj-htdB0uUPDZ1Iktfi87he7PpEw/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block", padding: "10px 24px",
                background: "var(--green-main)", color: "var(--white)",
                borderRadius: 20, fontSize: 12, fontWeight: 500,
                textDecoration: "none",
              }}
            >
              フィードバックを送る →
            </a>
          </div>

          {/* 戻るボタン（下部） */}
          <button onClick={onBack} style={{
            width: "100%", padding: 12, borderRadius: 10, marginTop: 8,
            background: "var(--white)", fontSize: 13,
            border: "0.5px solid var(--gray-border)", color: "var(--gray-soft)",
            cursor: "pointer",
          }}>
             一覧へ戻る
          </button>

        </div>
      </div>
    </div>
  );
}

function Section({ title, emoji, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 14 }}>{emoji}</span>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: "var(--gray-mid)", letterSpacing: "0.04em",
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
