"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getSessionId } from "../lib/session";

export default function FavoriteList({ onSelect }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from("favorites")
        .select("id, recipe_id, recipes(*)")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (e) {
      console.error("Fetch favorites error:", e);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (e, favoriteId) => {
    e.stopPropagation();
    await supabase.from("favorites").delete().eq("id", favoriteId);
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--gray-muted)" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 13 }}>読み込み中...</div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🤍</div>
        <div style={{ fontSize: 14, color: "var(--gray-ink)", marginBottom: 6 }}>
          お気に入りがまだありません
        </div>
        <div style={{ fontSize: 12, color: "var(--gray-soft)" }}>
          レシピ詳細画面の 🤍 を押して保存しましょう
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--gray-soft)", marginBottom: 14 }}>
        {favorites.length}件のお気に入り
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {favorites.map((fav) => {
          const recipe = fav.recipes;
          if (!recipe) return null;
          return (
            <button
              key={fav.id}
              onClick={() => onSelect(recipe)}
              style={{
                width: "100%", textAlign: "left",
                border: "0.5px solid var(--gray-border)", borderRadius: 12,
                padding: "14px", background: "var(--white)", cursor: "pointer",
              }}
            >
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", gap: 8,
              }}>
                <div style={{ flex: 1 }}>
                  {/* レシピ名 */}
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    color: "var(--gray-ink)", marginBottom: 4,
                  }}>
                    {recipe.name}
                  </div>

                  {/* キャッチコピー */}
                  {recipe.catchcopy && (
                    <div style={{
                      fontSize: 11, color: "var(--green-mid)",
                      marginBottom: 8, fontStyle: "italic",
                    }}>
                      " {recipe.catchcopy} "
                    </div>
                  )}

                  {/* バッジ */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {recipe.texture && (
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 12,
                        background: "var(--green-pale)", color: "var(--green-mid)",
                      }}>
                        {recipe.texture}
                      </span>
                    )}
                    {recipe.time && (
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 12,
                        background: "var(--amber-pale)", color: "var(--amber-dark)",
                      }}>
                        {recipe.time}
                      </span>
                    )}
                    {recipe.difficulty_level && (
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 12,
                        background: "var(--gray-light)", color: "var(--gray-mid)",
                      }}>
                        {recipe.difficulty_level}
                      </span>
                    )}
                  </div>
                </div>

                {/* 削除ボタン */}
                <button
                  onClick={(e) => removeFavorite(e, fav.id)}
                  style={{
                    background: "transparent", border: "none",
                    fontSize: 18, cursor: "pointer", flexShrink: 0,
                    color: "var(--gray-muted)",
                  }}
                >
                  ❤️
                </button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
