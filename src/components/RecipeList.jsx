"use client";
import { useState, useRef } from "react";

export default function RecipeList({ recipes, onSelect, onRegenerate, loading }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);
  const mouseStartX = useRef(null);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return;
    if (diff > 0 && current < recipes.length - 1) setCurrent((p) => p + 1);
    if (diff < 0 && current > 0) setCurrent((p) => p - 1);
    touchStartX.current = null;
  };
  const handleMouseDown = (e) => { mouseStartX.current = e.clientX; };
  const handleMouseUp = (e) => {
    if (mouseStartX.current === null) return;
    const diff = mouseStartX.current - e.clientX;
    if (Math.abs(diff) < 40) return;
    if (diff > 0 && current < recipes.length - 1) setCurrent((p) => p + 1);
    if (diff < 0 && current > 0) setCurrent((p) => p - 1);
    mouseStartX.current = null;
  };

  const recipe = recipes[current];

  const comparePoints = [
    { emoji: "🍬", label: "甘さ",   value: recipe.sweetness },
    { emoji: "✋", label: "食感",   value: recipe.texture },
    { emoji: "⏱", label: "時間",   value: recipe.time },
    { emoji: "✅", label: "難易度", value: recipe.difficulty_level },
  ].filter((p) => p.value);

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
        <span style={{ fontSize: 11, color: "var(--green-mid)" }}>左右にスワイプして比較</span>
      </div>

      {/* スワイプエリア */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ padding: "16px", userSelect: "none", cursor: "grab" }}
      >
        {/* カード */}
        <div
          key={current}
          className="animate-fade-up"
          style={{
            border: "0.5px solid var(--gray-border)", borderRadius: 14,
            overflow: "hidden", background: "var(--white)",
          }}
        >
          {/* カードヘッダー */}
          <div style={{
            background: "var(--green-main)", padding: "14px 16px",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
              {current + 1} / {recipes.length}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--white)", lineHeight: 1.4 }}>
              {recipe.name}
            </div>
          </div>

          {/* 区切り線 */}
          <div style={{ height: "0.5px", background: "var(--gray-border)" }} />

          {/* 比較ポイント一覧 */}
          <div style={{ padding: "4px 0" }}>
            {comparePoints.map((point, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 16px",
                borderBottom: i < comparePoints.length - 1
                  ? "0.5px solid var(--gray-border)" : "none",
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: "center" }}>
                  {point.emoji}
                </span>
                <span style={{ fontSize: 12, color: "var(--gray-soft)", width: 44, flexShrink: 0 }}>
                  {point.label}
                </span>
                <span style={{ fontSize: 13, color: "var(--gray-ink)", fontWeight: 500 }}>
                  {point.value}
                </span>
              </div>
            ))}

            {/* 一言紹介 */}
            {recipe.feature && (
              <div style={{
                margin: "8px 12px 12px",
                background: "var(--gray-bg)", borderRadius: 8,
                padding: "10px 12px", fontSize: 12,
                color: "var(--gray-mid)", lineHeight: 1.6,
              }}>
                {recipe.feature}
              </div>
            )}
          </div>

          {/* 詳細ボタン */}
          <div style={{ padding: "0 12px 14px" }}>
            <button
              onClick={() => onSelect(recipe)}
              style={{
                width: "100%", padding: "11px", borderRadius: 10,
                background: "var(--green-main)", color: "var(--white)",
                border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >
              詳細を見る →
            </button>
          </div>
        </div>

        {/* ドットインジケーター */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 6, paddingTop: 14,
        }}>
          {recipes.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 20 : 7, height: 7, borderRadius: 4,
                background: i === current ? "var(--green-main)" : "var(--gray-border)",
                transition: "all 0.25s ease", cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* 再生成ボタン */}
      <div style={{ padding: "0 16px 16px" }}>
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
