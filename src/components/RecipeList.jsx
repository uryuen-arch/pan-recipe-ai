"use client";

const TEXTURE_COLOR = {
  ふわふわ: { bg: "var(--green-pale)", text: "var(--green-mid)" },
  しっとり: { bg: "var(--green-pale)", text: "var(--green-mid)" },
  ハード:   { bg: "#f1efe8",           text: "var(--gray-mid)" },
};

export default function RecipeList({ recipes, onSelect, onBack }) {
  return (
    <div className="animate-fade-up">
      <p className="text-xs mb-4" style={{ color: "var(--gray-soft)" }}>
        {recipes.length}件のレシピが見つかりました
      </p>

      <div className="flex flex-col gap-3 mb-4">
        {recipes.map((recipe, i) => {
          const tc = TEXTURE_COLOR[recipe.texture] || TEXTURE_COLOR["ハード"];
          return (
            <button
              key={i}
              onClick={() => onSelect(recipe)}
              className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={{
                background: "var(--white)",
                border: "1px solid var(--gray-border)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--gray-ink)" }}>
                  {recipe.name}
                </p>
                <span style={{ color: "var(--gray-muted)", fontSize: 18, flexShrink: 0 }}>›</span>
              </div>

              <div className="flex gap-2 mt-2 mb-3">
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: tc.bg, color: tc.text }}
                >
                  {recipe.texture}
                </span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "var(--amber-pale)", color: "var(--amber-dark)" }}
                >
                  {recipe.time}
                </span>
              </div>

              <p className="text-xs" style={{ color: "var(--gray-soft)" }}>
                {recipe.ingredients.slice(0, 4).join("・")}
                {recipe.ingredients.length > 4 && ` ほか${recipe.ingredients.length - 4}点`}
              </p>
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 rounded-xl text-sm transition-all"
        style={{
          background: "transparent",
          border: "1px solid var(--gray-border)",
          color: "var(--gray-soft)",
        }}
      >
        ← 条件を変えて再生成
      </button>
    </div>
  );
}
