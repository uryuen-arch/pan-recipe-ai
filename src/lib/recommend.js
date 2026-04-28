// ─────────────────────────────────────
// STEP① たんぱく → 膨らみ・弾力スコア
// ─────────────────────────────────────
const proteinScore = (protein) => {
  if (protein >= 13)   return 3; // 強い
  if (protein >= 11.5) return 2; // 普通
  return 1;                      // 弱い
};

// ─────────────────────────────────────
// STEP② 灰分 → 風味スコア
// ─────────────────────────────────────
const ashScore = (ash) => {
  if (ash >= 0.5) return 3; // 風味強い
  if (ash >= 0.4) return 2; // 普通
  return 1;                 // あっさり
};

// ─────────────────────────────────────
// STEP③ スコア → 食感タグに変換
// ─────────────────────────────────────
export const getTextureTags = (protein, ash) => {
  const p = proteinScore(protein);
  const a = ashScore(ash);
  const tags = [];

  if (p >= 2 && a <= 2) tags.push("ふんわり");
  if (p >= 2)           tags.push("もっちり");
  if (a >= 2)           tags.push("ハード");
  if (a === 3)          tags.push("風味強い");
  if (p === 1)          tags.push("しっとり");

  return tags;
};

// ─────────────────────────────────────
// STEP④ 物性スコアを詳細に持つ
// ─────────────────────────────────────
export const getProductScores = (protein, ash) => {
  return {
    volume:     proteinScore(protein), // 膨らみ
    elasticity: proteinScore(protein), // 弾力
    flavor:     ashScore(ash),         // 風味
  };
};

// ─────────────────────────────────────
// STEP⑤ レシピとのマッチングスコア
// ─────────────────────────────────────
const matchScore = (productTags, recipeTexture, recipeFeature) => {
  let score = 0;

  // レシピの食感とタグが一致
  if (recipeTexture === "ふんわり" && productTags.includes("ふんわり")) score += 3;
  if (recipeTexture === "しっとり" && productTags.includes("しっとり")) score += 3;
  if (recipeTexture === "ハード系" && productTags.includes("ハード"))   score += 3;

  // レシピのfeatureとタグが一致
  if (recipeFeature?.includes("風味") && productTags.includes("風味強い")) score += 2;
  if (recipeFeature?.includes("もっちり") && productTags.includes("もっちり")) score += 2;
  if (recipeFeature?.includes("ふんわり") && productTags.includes("ふんわり")) score += 2;

  return score;
};

// ─────────────────────────────────────
// STEP⑥ おすすめ理由を生成
// ─────────────────────────────────────
const getReason = (product, recipeTexture) => {
  const p = proteinScore(product.protein);
  const a = ashScore(product.ash);

  if (recipeTexture === "ふんわり") {
    if (p === 3) return `たんぱく質${product.protein}%でグルテンが強く、ふんわり高く膨らみます`;
    if (p === 2) return `バランスのよいたんぱく量でふんわり仕上がります`;
  }
  if (recipeTexture === "しっとり") {
    if (p <= 2) return `たんぱく量が控えめでしっとりやわらかい食感になります`;
  }
  if (recipeTexture === "ハード系") {
    if (a === 3) return `灰分${product.ash}%で風味豊かなハード系パンに最適です`;
    if (a === 2) return `適度な灰分量でハード系の風味が出ます`;
  }

  // デフォルト
  if (p === 3) return `高たんぱく（${product.protein}%）で膨らみと弾力が抜群です`;
  if (a === 3) return `灰分が高く（${product.ash}%）風味豊かに仕上がります`;
  return `たんぱく${product.protein}%・灰分${product.ash}%でバランスのよい粉です`;
};

// ─────────────────────────────────────
// メイン：レシピにマッチする商品を返す
// ─────────────────────────────────────
export const getRecommendedProducts = (products, recipe, limit = 2) => {
  const recipeTexture = recipe.texture || "";
  const recipeFeature = recipe.feature || "";

  return products
    .map((product) => {
      const tags = getTextureTags(product.protein, product.ash);
      const score = matchScore(tags, recipeTexture, recipeFeature);
      const reason = getReason(product, recipeTexture);
      return { ...product, tags, score, reason };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
