// ─────────────────────────────────────
// 材料マッチングエンジン
// ─────────────────────────────────────

// 材料名の表記ゆれを吸収（ユーザー入力 → 正規化）
const NORMALIZE_MAP = {
  "強力粉":       ["強力粉", "ぱん粉", "パン粉以外", "ブレッドフラワー"],
  "イースト":     ["イースト", "ドライイースト", "酵母", "天然酵母"],
  "塩":           ["塩", "食塩", "岩塩", "海塩"],
  "バター":       ["バター", "無塩バター", "有塩バター", "発酵バター"],
  "牛乳":         ["牛乳", "ミルク", "全乳", "低脂肪乳"],
  "砂糖":         ["砂糖", "グラニュー糖", "上白糖", "きび砂糖", "三温糖", "はちみつ", "蜂蜜", "メープル"],
  "卵":           ["卵", "玉子", "たまご", "鶏卵"],
  "オリーブオイル": ["オリーブオイル", "オリーブ油", "エキストラバージン"],
  "サラダ油":     ["サラダ油", "植物油", "菜種油", "キャノーラ油", "油"],
  "全粒粉":       ["全粒粉", "ホールウィート"],
  "豆乳":         ["豆乳", "無調整豆乳"],
};

// ユーザー入力を正規化
function normalizeIngredient(input) {
  const trimmed = input.trim();
  for (const [canonical, aliases] of Object.entries(NORMALIZE_MAP)) {
    if (aliases.some(alias => trimmed.includes(alias)) || trimmed.includes(canonical)) {
      return canonical;
    }
  }
  return trimmed; // マッチしない場合はそのまま返す
}

// ユーザーの材料リストを正規化
function normalizeUserIngredients(userIngredients) {
  return userIngredients.map(normalizeIngredient);
}

// 材料が含まれているか確認
function hasIngredient(normalizedList, target) {
  const normalizedTarget = normalizeIngredient(target);
  return normalizedList.some(item =>
    item === normalizedTarget || item.includes(normalizedTarget) || normalizedTarget.includes(item)
  );
}

// ─────────────────────────────────────
// メイン：マッチングスコアを計算
// ─────────────────────────────────────
export function matchRecipes(userIngredients, profiles) {
  const normalized = normalizeUserIngredients(userIngredients);

  return profiles.map(profile => {
    let score = 0;
    const missing = [];
    const substituted = [];
    const matched = [];

    const required = profile.required_ingredients || [];
    const optional = profile.optional_ingredients || [];
    const subs = profile.substitutes || {};

    // ① 必須材料チェック（スコア3点）
    for (const req of required) {
      if (hasIngredient(normalized, req)) {
        score += 3;
        matched.push(req);
      } else if (subs[req]) {
        // 代替材料があるか確認
        const sub = subs[req];
        if (hasIngredient(normalized, sub)) {
          score += 1;
          substituted.push({ original: req, substitute: sub });
        } else {
          missing.push(req);
          score -= 1; // 必須材料が不足はマイナス
        }
      } else {
        missing.push(req);
        score -= 1;
      }
    }

    // ② 任意材料チェック（スコア1点）
    for (const opt of optional) {
      if (hasIngredient(normalized, opt)) {
        score += 1;
        matched.push(opt);
      }
    }

    // ③ 分類を決定
    let category;
    if (missing.length === 0) {
      category = "perfect";   // 今すぐ作れる
    } else if (missing.length <= 2) {
      category = "almost";    // あとこれがあれば
    } else {
      category = "lacking";   // 材料が足りない
    }

    return {
      profile,
      score,
      missing,
      substituted,
      matched,
      category,
    };
  })
  .sort((a, b) => {
    // カテゴリ優先順位: perfect > almost > lacking
    const catOrder = { perfect: 0, almost: 1, lacking: 2 };
    if (catOrder[a.category] !== catOrder[b.category]) {
      return catOrder[a.category] - catOrder[b.category];
    }
    return b.score - a.score;
  });
}

// ─────────────────────────────────────
// 具材を抽出（基本材料以外）
// ─────────────────────────────────────
const BASE_INGREDIENTS = new Set([
  "強力粉", "薄力粉", "全粒粉", "水", "牛乳", "豆乳",
  "バター", "マーガリン", "油", "オリーブオイル", "サラダ油",
  "砂糖", "塩", "イースト", "ドライイースト", "卵",
  "はちみつ", "蜂蜜", "メープル", "グラニュー糖", "上白糖",
]);

export function extractFillings(userIngredients) {
  return userIngredients.filter(ing => {
    const normalized = normalizeIngredient(ing);
    return !BASE_INGREDIENTS.has(normalized) &&
           !Array.from(BASE_INGREDIENTS).some(base => ing.includes(base));
  });
}

// ─────────────────────────────────────
// 代替情報のテキスト生成
// ─────────────────────────────────────
export function getSubstituteNote(substituted) {
  if (substituted.length === 0) return null;
  return substituted.map(s => `${s.original}の代わりに${s.substitute}を使用`).join("・");
}
