"use client";

const TEXTURE_COLOR = {
  ふわふわ: { bg: "var(--green-pale)", text: "var(--green-mid)" },
  しっとり: { bg: "var(--green-pale)", text: "var(--green-mid)" },
  ハード:   { bg: "#f1efe8",           text: "var(--gray-mid)" },
};

export default function RecipeDetail({ recipe, onBack }) {
  const tc = TEXTURE_COLOR[recipe.texture] || TEXTURE_COLOR["ハード"];

  return (
    <div className="animate-fade-up">
      {/* 戻るボタン */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full mb-5 transition-all active:scale-95"
        style={{
          background: "var(--green-pale)",
          border: "1px solid var(--green-light)",
          color: "var(--green-deep)",
        }}
      >
        ← 一覧へ戻る
      </button>

      {/* タイトル */}
      <h2
        className="text-xl font-bold mb-3 leading-snug animate-fade-up-1"
        style={{ color: "var(--gray-ink)" }}
      >
        {recipe.name}
      </h2>

      {/* バッジ */}
      <div className="flex gap-2 mb-5 animate-fade-up-2">
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: tc.bg, color: tc.text }}
        >
          {recipe.texture}
        </span>
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "var(--amber-pale)", color: "var(--amber-dark)" }}
        >
          {recipe.time}
        </span>
      </div>

      {/* 発酵時間 */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 animate-fade-up-3"
        style={{ background: "var(--amber-pale)" }}
      >
        <span style={{ fontSize: 20 }}>⏱</span>
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--amber-dark)" }}>
            発酵時間
          </p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "var(--amber-dark)" }}>
            {recipe.fermentation}
          </p>
        </div>
      </div>

      {/* 材料 */}
      <section className="mb-6 animate-fade-up-4">
        <h3
          className="text-xs font-medium mb-3 uppercase tracking-wider"
          style={{ color: "var(--gray-soft)" }}
        >
          材料
        </h3>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--gray-border)" }}
        >
          {recipe.ingredients.map((ing, i) => (
            <div
              key={i}
              className="px-4 py-3 text-sm flex items-center"
              style={{
                borderBottom:
                  i < recipe.ingredients.length - 1
                    ? "1px solid var(--gray-border)"
                    : "none",
                background: i % 2 === 0 ? "var(--white)" : "var(--gray-bg)",
                color: "var(--gray-ink)",
              }}
            >
              <span
                className="w-5 h-5 rounded-full text-xs flex items-center justify-center mr-3 flex-shrink-0"
                style={{ background: "var(--green-pale)", color: "var(--green-mid)" }}
              >
                {i + 1}
              </span>
              {ing}
            </div>
          ))}
        </div>
      </section>

      {/* 作り方 */}
      <section className="mb-6 animate-fade-up-5">
        <h3
          className="text-xs font-medium mb-3 uppercase tracking-wider"
          style={{ color: "var(--gray-soft)" }}
        >
          作り方
        </h3>
        <div className="flex flex-col gap-3">
          {recipe.steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl p-4"
              style={{
                background: "var(--white)",
                border: "1px solid var(--gray-border)",
              }}
            >
              <span
                className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "var(--green-main)", color: "var(--white)" }}
              >
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: "var(--gray-ink)" }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ポイント */}
      <section
        className="rounded-xl p-4 animate-fade-up-5"
        style={{ background: "var(--green-pale)", border: "1px solid var(--green-light)" }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: "var(--green-deep)" }}>
          💡 ポイント
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--green-deep)" }}>
          {recipe.point}
        </p>
      </section>
    </div>
  );
}
