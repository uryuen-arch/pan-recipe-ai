"use client";

const CONDITION_GROUPS = [
  {
    key: "texture",
    label: "① 食感",
    options: ["ハード系", "ふんわり", "しっとり"],
    multi: true,
  },
  {
    key: "taste",
    label: "② 味",
    options: ["甘い", "食事系"],
    multi: true,
  },
  {
    key: "time",
    label: "③ 時間",
    options: ["時短（〜1時間）", "標準（1〜2時間）", "じっくり（低温発酵）"],
    multi: false,
  },
  {
    key: "method",
    label: "④ 調理方法",
    options: ["オーブン", "ホームベーカリー", "トースター", "フライパン"],
    multi: false,
  },
  {
    key: "difficulty",
    label: "⑤ 手間",
    options: ["超簡単", "簡単", "普通", "本格"],
    multi: false,
  },
];

const divider = { height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "14px 0" };

export default function StepConditions({ value, onChange, onGenerate, loading }) {
  const toggle = (item, multi) => {
    if (multi) {
      onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
    } else {
      // 同グループの他の選択を外して単一選択
      const group = CONDITION_GROUPS.find((g) => g.options.includes(item));
      const others = group ? group.options : [];
      const filtered = value.filter((v) => !others.includes(v));
      onChange(value.includes(item) ? filtered : [...filtered, item]);
    }
  };

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
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--green-deep)" }}>② 条件選択</span>
        <span style={{ fontSize: 11, color: "var(--green-mid)" }}>
          {value.length > 0 ? `${value.length}件選択中` : "任意で選択"}
        </span>
      </div>

      <div style={{ padding: "14px 16px 18px" }}>
        {CONDITION_GROUPS.map((group, gi) => (
          <div key={group.key}>
            {gi > 0 && <div style={divider} />}

            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--gray-mid)" }}>
                {group.label}
              </span>
              {group.multi && (
                <span style={{ fontSize: 10, color: "var(--gray-muted)", marginLeft: 6 }}>
                  複数可
                </span>
              )}
            </div>

            <div style={{
              display: "flex", flexWrap: "wrap", gap: 8,
            }}>
              {group.options.map((item) => {
                const sel = value.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggle(item, group.multi)}
                    disabled={loading}
                    style={{
                      padding: "8px 14px", borderRadius: 20, fontSize: 12,
                      background: sel ? "var(--green-pale)" : "var(--white)",
                      border: sel ? "1px solid var(--green-light)" : "0.5px solid var(--gray-border)",
                      color: sel ? "var(--green-deep)" : "var(--gray-ink)",
                      fontWeight: sel ? 500 : 400,
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* 生成ボタン */}
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            width: "100%", padding: 12, borderRadius: 10, marginTop: 18,
            background: loading ? "var(--green-light)" : "var(--green-main)",
            color: "var(--white)", border: "none", fontSize: 13, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? (
            <><span className="spinner" />レシピを生成中...</>
          ) : (
            "レシピを生成する"
          )}
        </button>
      </div>
    </div>
  );
}
