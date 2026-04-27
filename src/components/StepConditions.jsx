"use client";

const TEXTURES = ["ふわふわ", "ハード", "しっとり"];
const TIMES = ["時短", "じっくり"];

export default function StepConditions({ value, onChange, onGenerate, loading }) {
  const toggle = (item) => {
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  };

  const card = {
    background: "var(--white)", borderRadius: 16,
    border: "0.5px solid rgba(0,0,0,0.12)", overflow: "hidden",
  };
  const body = { padding: "14px 16px 18px" };
  const sectionTitle = { fontSize: 12, fontWeight: 500, color: "var(--gray-mid)", marginBottom: 8 };
  const divider = { height: "0.5px", background: "rgba(0,0,0,0.1)", margin: "14px 0" };

  const condBtn = (sel) => ({
    borderRadius: 8, padding: "10px", fontSize: 12, textAlign: "center", cursor: "pointer",
    background: sel ? "var(--green-pale)" : "var(--white)",
    border: sel ? "0.5px solid var(--green-light)" : "0.5px solid rgba(0,0,0,0.12)",
    color: sel ? "var(--green-deep)" : "var(--gray-ink)",
    fontWeight: sel ? 500 : 400,
  });

  return (
    <div style={card}>
      <div style={{
        background: "var(--green-pale)", padding: "10px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--green-deep)" }}>② 条件選択</span>
      </div>

      <div style={body}>
        <div style={sectionTitle}>食感を選んでください（複数可）</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {TEXTURES.map((item) => (
            <button key={item} onClick={() => toggle(item)} disabled={loading} style={condBtn(value.includes(item))}>
              {item}
            </button>
          ))}
        </div>

        <div style={divider} />

        <div style={sectionTitle}>調理時間を選んでください</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {TIMES.map((item) => (
            <button key={item} onClick={() => toggle(item)} disabled={loading} style={condBtn(value.includes(item))}>
              {item}
            </button>
          ))}
        </div>

        <button onClick={onGenerate} disabled={loading} style={{
          width: "100%", padding: 11, borderRadius: 8, marginTop: 14,
          background: loading ? "var(--green-light)" : "var(--green-main)",
          color: "var(--white)", border: "none", fontSize: 13, fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {loading ? <><span className="spinner" />レシピを生成中...</> : "レシピを生成する"}
        </button>
      </div>
    </div>
  );
}
