"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "pan_recipe_past_ingredients";
const MAX_PAST = 10;

function splitIngredients(str) {
  if (typeof str !== "string" || str.trim() === "") return [];
  return str.split(/[,、]/).map((s) => s.trim()).filter(Boolean);
}

export default function StepIngredients({ value = "", onChange, onNext, done }) {
  const [past, setPast] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setPast(Array.isArray(saved) ? saved : []);
    } catch { setPast([]); }
  }, []);

  const savePast = (str) => {
    const items = splitIngredients(str);
    const merged = [...new Set([...items, ...past])].slice(0, MAX_PAST);
    setPast(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  const addFromTag = (item) => {
    if (done) return;
    const current = splitIngredients(value);
    if (!current.includes(item)) onChange(current.length > 0 ? value + "、" + item : item);
  };

  const handleNext = () => {
    if (!value.trim()) { setError("材料を入力してください"); return; }
    setError("");
    savePast(value);
    onNext();
  };

  const selectedTags = splitIngredients(value);

  const card = {
    background: "var(--white)",
    borderRadius: 16,
    border: "0.5px solid rgba(0,0,0,0.12)",
    overflow: "hidden",
    marginBottom: 0,
  };
  const body = { padding: "14px 16px 18px" };
  const sectionTitle = { fontSize: 12, fontWeight: 500, color: "var(--gray-mid)", marginBottom: 8 };
  const divider = { height: "0.5px", background: "rgba(0,0,0,0.1)", margin: "14px 0" };

  return (
    <div style={card}>
      {/* セクションヘッダー */}
      <div style={{
        background: "var(--green-pale)", padding: "10px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--green-deep)" }}>① 材料入力</span>
        {done && <span style={{ fontSize: 11, color: "var(--green-mid)" }}>✓ 完了</span>}
      </div>

      <div style={body}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-mid)", marginBottom: 6 }}>
          手元の材料を入力
        </div>
        <textarea
          rows={3}
          value={value}
          onChange={(e) => { onChange(e.target.value); setError(""); }}
          placeholder="例：強力粉、バター、砂糖、牛乳"
          disabled={done}
          style={{
            width: "100%", borderRadius: 8, padding: "10px 12px", fontSize: 13,
            border: error ? "1.5px solid #ef4444" : "0.5px solid rgba(0,0,0,0.22)",
            background: done ? "var(--gray-light)" : "var(--white)",
            color: "var(--gray-ink)", lineHeight: 1.7, resize: "none",
            outline: "none", fontFamily: "inherit",
          }}
          onFocus={(e) => { if (!done) e.target.style.border = "1.5px solid var(--green-main)"; }}
          onBlur={(e) => { e.target.style.border = error ? "1.5px solid #ef4444" : "0.5px solid rgba(0,0,0,0.22)"; }}
        />
        {error && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{error}</p>}
        {!done && (
          <p style={{ fontSize: 11, color: "var(--gray-muted)", marginTop: 5 }}>
            カンマ（,）または読点（、）で複数入力できます
          </p>
        )}

        {past.length > 0 && (
          <>
            <div style={divider} />
            <div style={sectionTitle}>過去に使った材料</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 6 }}>
              {past.map((item, i) => {
                const sel = selectedTags.includes(item);
                return (
                  <button key={i} onClick={() => addFromTag(item)} disabled={done} style={{
                    background: sel ? "var(--green-pale)" : "var(--gray-light)",
                    border: sel ? "0.5px solid var(--green-light)" : "0.5px solid var(--gray-border)",
                    borderRadius: 20, padding: "5px 11px", fontSize: 11,
                    color: sel ? "var(--green-deep)" : "var(--gray-mid)",
                    fontWeight: sel ? 500 : 400, cursor: done ? "default" : "pointer",
                  }}>
                    {item}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {!done && (
          <button onClick={handleNext} style={{
            width: "100%", padding: 11, borderRadius: 8, marginTop: 14,
            background: "var(--green-main)", color: "var(--white)",
            border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            次へ
          </button>
        )}
      </div>
    </div>
  );
}
