"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getRecommendedProducts, getTextureTags } from "../lib/recommend";

export default function ProductRecommend({ recipe }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAndMatch();
  }, []);

  const fetchAndMatch = async () => {
    setLoading(true);
    try {
      // DBから粉類を取得
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("category", ["強力粉", "準強力粉"]);

      if (error) throw error;

      // マッチング
      const recommended = getRecommendedProducts(data, recipe, 2);
      setProducts(recommended);
    } catch (e) {
      console.error("Product recommend error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* セクションヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>🛒</span>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: "var(--gray-mid)", letterSpacing: "0.04em",
        }}>
          このレシピにおすすめの食材
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {products.map((product, i) => {
          const tags = getTextureTags(product.protein, product.ash);
          return (
            <div key={i} style={{
              border: "0.5px solid var(--green-light)",
              borderRadius: 12, overflow: "hidden",
              background: "var(--white)",
            }}>
              {/* 商品ヘッダー */}
              <div style={{
                background: "var(--green-pale)",
                padding: "8px 14px",
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🌾</span>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: "var(--green-deep)",
                  }}>
                    {product.name}
                  </span>
                  <span style={{
                    fontSize: 10, color: "var(--gray-soft)",
                    background: "var(--white)", borderRadius: 20,
                    padding: "1px 7px",
                  }}>
                    {product.category}
                  </span>
                </div>
              </div>

              <div style={{ padding: "12px 14px" }}>
                {/* おすすめ理由 */}
                <div style={{
                  fontSize: 12, color: "var(--green-deep)",
                  fontWeight: 500, marginBottom: 8,
                }}>
                  👉 {recipe.texture}仕上げたいならこれおすすめ！
                </div>
                <div style={{
                  fontSize: 12, color: "var(--gray-mid)",
                  lineHeight: 1.6, marginBottom: 10,
                }}>
                  {product.reason}
                </div>

                {/* スペック */}
                <div style={{
                  display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap",
                }}>
                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 12,
                    background: "var(--amber-pale)", color: "var(--amber-dark)",
                  }}>
                    たんぱく {product.protein}%
                  </span>
                  <span style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 12,
                    background: "var(--gray-light)", color: "var(--gray-mid)",
                  }}>
                    灰分 {product.ash}%
                  </span>
                  {tags.map((tag, j) => (
                    <span key={j} style={{
                      fontSize: 10, padding: "3px 8px", borderRadius: 12,
                      background: "var(--green-pale)", color: "var(--green-mid)",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 楽天ROOMリンク */}
                {product.room_url && product.room_url !== "https://room.rakuten.co.jp/" && (
                  <a
                    href={product.room_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "8px 16px", borderRadius: 20,
                      background: "#bf0000", color: "var(--white)",
                      fontSize: 12, fontWeight: 500, textDecoration: "none",
                    }}
                  >
                    楽天ROOMで見る →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
