"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getSessionId } from "../lib/session";
import ProductRecommend from "./ProductRecommend";

export default function RecipeDetail({ recipe, onBack }) {
  const [favoriteId, setFavoriteId] = useState(null);
  const [recipeDbId, setRecipeDbId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  initRecipe();
}, []);

  const initRecipe = async () => {
    try {
      const sessionId = getSessionId();
      let { data: existing } = await supabase
        .from("recipes").select("id")
        .eq("name", recipe.name)
        .eq("catchcopy", recipe.catchcopy || "")
        .limit(1).maybeSingle();

      let dbId = existing?.id;

      if (!dbId) {
        const { data: inserted, error } = await supabase
          .from("recipes").insert({
            name: recipe.name, texture: recipe.texture,
            time: recipe.time, servings: recipe.servings,
            sweetness: recipe.sweetness, difficulty_level: recipe.difficulty_level,
            catchcopy: recipe.catchcopy || "", feature: recipe.feature,
            recommend: recipe.recommend, ingredients: recipe.ingredients,
            steps: recipe.steps, fermentation: recipe.fermentation,
            point: recipe.point,
          }).select("id").maybeSingle();

        if (error && error.code === "23505") {
          const { data: retry } = await supabase
            .from("recipes").select("id")
            .eq("name", recipe.name).eq("catchcopy", recipe.catchcopy || "")
            .limit(1).maybeSingle();
          dbId = retry?.id;
        } else {
          dbId = inserted?.id;
        }
      }

      setRecipeDbId(dbId);

      if (dbId) {
        const { data: fav } = await supabase
          .from("favorites").select("id")
          .eq("recipe_id", dbId).eq("session_id", sessionId)
          .limit(1).maybeSingle();
        if (fav) setFavoriteId(fav.id);
      }
    } catch (e) {
      console.error("DB init error:", e);
    }
  };

  const toggleFavorite = async () => {
    if (!recipeDbId) return;
    setSaving(true);
    const sessionId = getSessionId();
    try {
      if (favoriteId) {
        await supabase.from("favorites").delete().eq("id", favoriteId);
        setFavoriteId(null);
      } else {
        const { data, error } = await supabase
          .from("favorites").insert({ recipe_id: recipeDbId, session_id: sessionId })
          .select("id").single();
        if (error) throw error;
        setFavoriteId(data.id);
      }
    } catch (e) {
      console.error("Favorite error:", e);
    } finally {
      setSaving(false);
    }
  };

  // stepsDataがあればそちらを使い、なければstepsを解析
  const stepsData = recipe.stepsData || (recipe.steps || []).map((s, i) => {
    const match = s.match(/^【(.+?)】(.*)$/s);
    const timeMatch = s.match(/（目安：(.+?)）/);
    return {
      index: i + 1,
      label: match ? match[1] : `手順${i + 1}`,
      desc: match ? match[2].replace(/（目安：.+?）/, "").trim() : s,
      time: timeMatch ? timeMatch[1] : null,
    };
  });

  const ingredientsData = recipe.ingredientsData || [];

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
          }}>← 一覧へ</button>
          <span style={{
            fontSize: 13, fontWeight: 500, color: "var(--green-deep)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>{recipe.name}</span>
          <button onClick={toggleFavorite} disabled={saving || !recipeDbId} style={{
            fontSize: 20, background: "transparent", border: "none",
            cursor: recipeDbId ? "pointer" : "default", flexShrink: 0,
            opacity: saving ? 0.5 : 1,
          }}>{favoriteId ? "❤️" : "🤍"}</button>
        </div>

        <div style={{ padding: "16px 16px 64px" }}>

          {/* バッジ */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {recipe.texture && <Badge color="green">{recipe.texture}</Badge>}
            {recipe.time && <Badge color="amber">{recipe.time}</Badge>}
            {recipe.servings && <Badge color="gray">{recipe.servings}</Badge>}
            {recipe.difficulty_level && <Badge color="gray">{recipe.difficulty_level}</Badge>}
            {recipe.method && <Badge color="gray">{recipe.method}</Badge>}
          </div>

          {/* キャッチコピー */}
          {recipe.catchcopy && (
            <div style={{ fontSize: 13, color: "var(--green-mid)", fontWeight: 500, marginBottom: 14, fontStyle: "italic" }}>
              " {recipe.catchcopy} "
            </div>
          )}

          {/* 発酵バナー */}
          {recipe.fermentation && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "var(--amber-pale)", borderRadius: 10,
              padding: "12px 14px", marginBottom: 16,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⏱</span>
              <div>
                <div style={{ fontSize: 12, color: "var(--amber-dark)", fontWeight: 500 }}>
                  {recipe.fermentation}
                </div>
                {recipe.yeastRatio && (
                  <div style={{ fontSize: 11, color: "var(--amber-dark)", marginTop: 3 }}>
                    イースト量：粉量の{recipe.yeastRatio}%
                    {recipe.yeastRatio >= 2 ? "（時短設定・2倍量）" :
                     recipe.yeastRatio <= 0.5 ? "（低温長時間発酵・少量）" : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 材料テーブル（ベーカーズ%付き） */}
          <Section title="材料" emoji="🧂">
            {ingredientsData.length > 0 ? (
              <div style={{ borderRadius: 10, overflow: "hidden", border: "0.5px solid var(--gray-border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--gray-bg)" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--gray-soft)", fontWeight: 500, borderBottom: "0.5px solid var(--gray-border)" }}>材料</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--gray-soft)", fontWeight: 500, borderBottom: "0.5px solid var(--gray-border)" }}>分量</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--green-mid)", fontWeight: 500, borderBottom: "0.5px solid var(--gray-border)", whiteSpace: "nowrap" }}>BP%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientsData.map((ing, i) => {
                      const isFilling = ing.isFilling;
                      return (
                        <tr key={i} style={{
                          borderBottom: i < ingredientsData.length - 1 ? "0.5px solid var(--gray-border)" : "none",
                          background: isFilling ? "var(--amber-pale)" : i % 2 === 0 ? "var(--white)" : "var(--gray-bg)",
                        }}>
                          <td style={{ padding: "10px 12px", color: "var(--gray-ink)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {isFilling && (
                                <span style={{
                                  fontSize: 9, padding: "1px 5px", borderRadius: 4,
                                  background: "var(--amber-dark)", color: "var(--white)",
                                  fontWeight: 500, whiteSpace: "nowrap",
                                }}>具材</span>
                              )}
                              {ing.name}
                            </div>
                            {ing.note && <div style={{ fontSize: 10, color: "var(--gray-muted)", marginTop: 2, paddingLeft: isFilling ? 30 : 0 }}>{ing.note}</div>}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--gray-ink)", whiteSpace: "nowrap" }}>
                            {ing.grams}{ing.unit || "g"}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", minWidth: 80 }}>
                            {ing.ratio !== undefined && (
                              <>
                                <div style={{ fontSize: 11, color: isFilling ? "var(--amber-dark)" : "var(--green-mid)", fontWeight: 500, marginBottom: 3 }}>
                                  {ing.ratio}%
                                </div>
                                <div style={{ height: 4, background: isFilling ? "#faeeda" : "var(--green-pale)", borderRadius: 2 }}>
                                  <div style={{
                                    height: 4,
                                    background: isFilling ? "var(--amber-dark)" : "var(--green-main)",
                                    borderRadius: 2,
                                    width: `${Math.min(ing.ratio, 100)}%`,
                                    transition: "width 0.5s ease",
                                  }} />
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {recipe.flourGrams && (
                  <div style={{ padding: "8px 12px", fontSize: 10, color: "var(--gray-muted)", background: "var(--gray-bg)", borderTop: "0.5px solid var(--gray-border)" }}>
                    ※ ベーカーズ%は強力粉{recipe.flourGrams}gを100%として計算
                  </div>
                )}
              </div>
            ) : (
              // ingredientsDataがない場合は文字列リストで表示
              <div style={{ borderRadius: 10, overflow: "hidden", border: "0.5px solid var(--gray-border)" }}>
                {(recipe.ingredients || []).map((ing, i) => (
                  <div key={i} style={{
                    padding: "10px 14px", fontSize: 13,
                    borderBottom: i < recipe.ingredients.length - 1 ? "0.5px solid var(--gray-border)" : "none",
                    background: i % 2 === 0 ? "var(--white)" : "var(--gray-bg)",
                    color: "var(--gray-ink)",
                  }}>{ing}</div>
                ))}
              </div>
            )}
          </Section>

          {/* 作り方 */}
          <Section title="作り方" emoji="👨‍🍳">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stepsData.map((step, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12,
                  background: "var(--white)", borderRadius: 10,
                  padding: "12px 14px", border: "0.5px solid var(--gray-border)",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "var(--green-main)", color: "var(--white)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 1,
                  }}>{step.index || i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--green-deep)", marginBottom: 4 }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--gray-ink)", lineHeight: 1.7 }}>
                      {step.desc}
                    </div>
                    {step.time && (
                      <div style={{ fontSize: 11, color: "var(--green-mid)", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                        ⏱ {step.time}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 焼成情報 */}
          {recipe.bakingConfig && recipe.bakingConfig.temp && (
            <Section title="焼成" emoji="🔥">
              <div style={{
                background: "var(--white)", borderRadius: 10,
                padding: "14px", border: "0.5px solid var(--gray-border)",
                display: "flex", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--gray-soft)", marginBottom: 4 }}>温度</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--gray-ink)" }}>
                    {recipe.bakingConfig.temp}℃
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--gray-soft)", marginBottom: 4 }}>時間</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--gray-ink)" }}>
                    {recipe.bakingConfig.time}分
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* ポイント */}
          {recipe.point && (
            <Section title="ポイント" emoji="💡">
              <div style={{ background: "var(--green-pale)", borderRadius: 10, padding: "14px", border: "0.5px solid var(--green-light)" }}>
                <p style={{ fontSize: 13, color: "var(--green-deep)", lineHeight: 1.8 }}>{recipe.point}</p>
              </div>
            </Section>
          )}

          {/* おすすめ食材 */}
          <ProductRecommend recipe={recipe} />

          {/* フィードバック */}
          <div style={{ border: "0.5px solid var(--gray-border)", borderRadius: 12, padding: "16px", marginTop: 8, marginBottom: 8, textAlign: "center" }}>
            <div style={{ fontSize: 16, marginBottom: 6 }}>📝</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-ink)", marginBottom: 4 }}>このレシピどうでしたか？</div>
            <div style={{ fontSize: 11, color: "var(--gray-soft)", marginBottom: 12 }}>ご意見・ご感想をお聞かせください</div>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSc-d07wzgD6k2VnNzhty6Bj-htdB0uUPDZ1Iktfi87he7PpEw/viewform?usp=publish-editor"
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", padding: "10px 24px", background: "var(--green-main)", color: "var(--white)", borderRadius: 20, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
              フィードバックを送る →
            </a>
          </div>

          <button onClick={onBack} style={{
            width: "100%", padding: 12, borderRadius: 10, marginTop: 8,
            background: "var(--white)", fontSize: 13,
            border: "0.5px solid var(--gray-border)", color: "var(--gray-soft)", cursor: "pointer",
          }}>← 一覧へ戻る</button>

        </div>
      </div>
    </div>
  );
}

function Badge({ color, children }) {
  const styles = {
    green: { background: "var(--green-pale)", color: "var(--green-mid)" },
    amber: { background: "var(--amber-pale)", color: "var(--amber-dark)" },
    gray:  { background: "var(--gray-light)", color: "var(--gray-mid)" },
  };
  return (
    <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 12, ...styles[color] }}>
      {children}
    </span>
  );
}

function Section({ title, emoji, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-mid)", letterSpacing: "0.04em" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
