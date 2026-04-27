"use client";

const TEXTURES = ["ふわふわ", "ハード", "しっとり"];
const TIMES = ["時短", "じっくり"];

export default function StepConditions({ value, onChange, onGenerate, onBack, loading }) {
  const toggle = (item) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div className="animate-fade-up">
      {/* 食感 */}
      <div className="mb-6">
        <p className="text-xs font-medium mb-3" style={{ color: "var(--gray-mid)" }}>
          食感を選んでください
          <span className="ml-1 font-normal" style={{ color: "var(--gray-muted)" }}>
            （複数可）
          </span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TEXTURES.map((item) => {
            const sel = value.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggle(item)}
                className="py-3 rounded-xl text-sm transition-all active:scale-95"
                style={{
                  background: sel ? "var(--green-pale)" : "var(--white)",
                  border: sel
                    ? "1.5px solid var(--green-light)"
                    : "1px solid var(--gray-border)",
                  color: sel ? "var(--green-deep)" : "var(--gray-ink)",
                  fontWeight: sel ? 500 : 400,
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* 時間 */}
      <div className="mb-8">
        <p className="text-xs font-medium mb-3" style={{ color: "var(--gray-mid)" }}>
          調理時間を選んでください
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TIMES.map((item) => {
            const sel = value.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggle(item)}
                className="py-3 rounded-xl text-sm transition-all active:scale-95"
                style={{
                  background: sel ? "var(--green-pale)" : "var(--white)",
                  border: sel
                    ? "1.5px solid var(--green-light)"
                    : "1px solid var(--gray-border)",
                  color: sel ? "var(--green-deep)" : "var(--gray-ink)",
                  fontWeight: sel ? 500 : 400,
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* 生成ボタン */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full py-3.5 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 mb-3"
        style={{
          background: loading ? "var(--green-light)" : "var(--green-main)",
          color: "var(--white)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? (
          <>
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            レシピを生成中...
          </>
        ) : (
          "レシピを生成する"
        )}
      </button>

      <button
        onClick={onBack}
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm transition-all"
        style={{
          background: "transparent",
          border: "1px solid var(--gray-border)",
          color: "var(--gray-soft)",
        }}
      >
        ← 戻る
      </button>
    </div>
  );
}
