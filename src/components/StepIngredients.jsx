"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "pan_recipe_past_ingredients";
const MAX_PAST = 10;

export default function StepIngredients({ value, onChange, onNext }) {
  const [past, setPast] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setPast(saved);
    } catch {
      setPast([]);
    }
  }, []);

  const savePast = (ingredientStr) => {
    const items = ingredientStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = [...new Set([...items, ...past])].slice(0, MAX_PAST);
    setPast(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  const addFromTag = (item) => {
    const current = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!current.includes(item)) {
      onChange(current.length > 0 ? value + "、" + item : item);
    }
  };

  const handleNext = () => {
    if (!value.trim()) {
      setError("材料を入力してください");
      return;
    }
    setError("");
    savePast(value);
    onNext();
  };

  const selectedTags = value
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="animate-fade-up">
      {/* 入力エリア */}
      <div className="mb-5">
        <label
          className="block text-xs font-medium mb-2"
          style={{ color: "var(--gray-mid)" }}
        >
          手元の材料を入力
        </label>
        <textarea
          rows={3}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setError("");
          }}
          placeholder="例）強力粉、バター、砂糖、牛乳"
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
          style={{
            border: error
              ? "1.5px solid #ef4444"
              : "1px solid var(--gray-border)",
            background: "var(--white)",
            color: "var(--gray-ink)",
            lineHeight: 1.7,
          }}
          onFocus={(e) =>
            (e.target.style.border = "1.5px solid var(--green-main)")
          }
          onBlur={(e) =>
            (e.target.style.border = error
              ? "1.5px solid #ef4444"
              : "1px solid var(--gray-border)")
          }
        />
        {error && (
          <p className="text-xs mt-1" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "var(--gray-muted)" }}>
          カンマ区切りで複数入力できます
        </p>
      </div>

      {/* 過去材料 */}
      {past.length > 0 && (
        <div className="mb-6">
          <p
            className="text-xs font-medium mb-3"
            style={{ color: "var(--gray-mid)" }}
          >
            過去に使った材料
          </p>
          <div className="flex flex-wrap gap-2">
            {past.map((item, i) => {
              const isSelected = selectedTags.includes(item);
              return (
                <button
                  key={i}
                  onClick={() => addFromTag(item)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: isSelected
                      ? "var(--green-pale)"
                      : "var(--gray-bg)",
                    border: isSelected
                      ? "1px solid var(--green-light)"
                      : "1px solid var(--gray-border)",
                    color: isSelected ? "var(--green-deep)" : "var(--gray-mid)",
                    fontWeight: isSelected ? 500 : 400,
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 次へボタン */}
      <button
        onClick={handleNext}
        className="w-full py-3.5 rounded-xl text-sm font-medium transition-all active:scale-95"
        style={{
          background: "var(--green-main)",
          color: "var(--white)",
        }}
      >
        次へ →
      </button>
    </div>
  );
}
