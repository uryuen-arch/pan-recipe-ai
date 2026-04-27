"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "pan_recipe_past_ingredients";
const MAX_PAST = 10;

export default function StepIngredients({ value, onChange, onNext }) {
  const [input, setInput] = useState("");
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

  const savePast = (ingredientsArray) => {
    const merged = [...new Set([...ingredientsArray, ...past])].slice(0, MAX_PAST);
    setPast(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  // 🔥 タグ追加
  const addTag = (text) => {
    const items = text
      .split(/[,、]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newTags = [...value];

    items.forEach((item) => {
      if (!newTags.includes(item)) {
        newTags.push(item);
      }
    });

    onChange(newTags);
  };

  // 🔥 タグ削除
  const removeTag = (target) => {
    onChange(value.filter((v) => v !== target));
  };

  // 🔥 入力処理
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === "、") {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
        setInput("");
      }
    }

    // バックスペースで最後削除
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const addFromTag = (item) => {
    if (!value.includes(item)) {
      onChange([...value, item]);
    }
  };

  const handleNext = () => {
    if (value.length === 0) {
      setError("材料を入力してください");
      return;
    }
    setError("");
    savePast(value);
    onNext();
  };

  return (
    <div className="animate-fade-up">
      {/* 入力エリア */}
      <div className="mb-5">
        <label className="block text-xs font-medium mb-2">
          手元の材料を入力
        </label>

        {/* 🔥 タグ入力ボックス */}
        <div
          className="flex flex-wrap gap-2 p-3 rounded-xl border"
          style={{
            border: error ? "1.5px solid #ef4444" : "1px solid #ddd",
          }}
        >
          {/* タグ表示 */}
          {value.map((tag, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{
                background: "#e6f7f0",
                color: "#059669",
              }}
            >
              {tag}
              <button onClick={() => removeTag(tag)}>×</button>
            </div>
          ))}

          {/* 入力 */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="入力してEnter"
            className="flex-1 outline-none text-sm"
          />
        </div>

        {error && (
          <p className="text-xs mt-1 text-red-500">{error}</p>
        )}
      </div>

      {/* 過去材料 */}
      {past.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium mb-3">
            過去に使った材料
          </p>
          <div className="flex flex-wrap gap-2">
            {past.map((item, i) => {
              const isSelected = value.includes(item);
              return (
                <button
                  key={i}
                  onClick={() => addFromTag(item)}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: isSelected ? "#d1fae5" : "#f3f4f6",
                    border: "1px solid #ddd",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 次へ */}
      <button
        onClick={handleNext}
        className="w-full py-3.5 rounded-xl text-sm font-medium"
        style={{
          background: "#10b981",
          color: "#fff",
        }}
      >
        次へ →
      </button>
    </div>
  );
}