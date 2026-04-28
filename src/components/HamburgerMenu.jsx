"use client";
import { useState } from "react";

export default function HamburgerMenu({ currentPage, onNavigate }) {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { key: "home",      label: "レシピ生成", emoji: "🍞" },
    { key: "favorites", label: "お気に入り", emoji: "❤️" },
  ];

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "transparent", border: "none",
          cursor: "pointer", padding: "4px 6px",
          display: "flex", flexDirection: "column", gap: 5,
        }}
      >
        {[0,1,2].map((i) => (
          <div key={i} style={{
            width: 20, height: 2, borderRadius: 1,
            background: "var(--green-deep)",
            transition: "all 0.2s",
          }} />
        ))}
      </button>

      {/* オーバーレイ */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 100,
          }}
        />
      )}

      {/* ドロワー */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: 220, height: "100vh",
        background: "var(--white)",
        zIndex: 101,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
        boxShadow: open ? "-4px 0 20px rgba(0,0,0,0.1)" : "none",
        display: "flex", flexDirection: "column",
      }}>
        {/* ドロワーヘッダー */}
        <div style={{
          background: "var(--green-pale)",
          padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--green-deep)" }}>
            🍞 メニュー
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "transparent", border: "none",
              fontSize: 18, cursor: "pointer", color: "var(--green-deep)",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* メニュー項目 */}
        <div style={{ padding: "12px 0" }}>
          {menuItems.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  setOpen(false);
                }}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "14px 20px",
                  display: "flex", alignItems: "center", gap: 12,
                  background: isActive ? "var(--green-pale)" : "transparent",
                  border: "none", cursor: "pointer",
                  borderLeft: isActive ? "3px solid var(--green-main)" : "3px solid transparent",
                }}
              >
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <span style={{
                  fontSize: 14,
                  color: isActive ? "var(--green-deep)" : "var(--gray-ink)",
                  fontWeight: isActive ? 500 : 400,
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
