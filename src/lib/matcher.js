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

// 基本材料（常に持っているとみなす）
const BASE_ALWAYS_HAVE = [
  "強力粉", "イースト", "ドライイースト", "塩", "水",
];

// 代替不可の材料
const NO_SUBSTITUTE = new Set(["卵", "バター"]);

// ─────────────────────────────────────
// メイン：マッチングスコアを計算
// ─────────────────────────────────────
export function matchRecipes(userIngredients, profiles) {
  // 基本材料を自動追加してからマッチング
  const normalized = normalizeUserIngredients([
    ...userIngredients,
    ...BASE_ALWAYS_HAVE,
  ]);

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
      } else if (NO_SUBSTITUTE.has(req)) {
        // 代替不可材料が足りない場合は大きくマイナス
        missing.push(req);
        score -= 5;
      } else if (subs[req]) {
        const sub = subs[req];
        if (hasIngredient(normalized, sub)) {
          score += 1;
          substituted.push({ original: req, substitute: sub });
        } else {
          missing.push(req);
          score -= 1;
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
    // 代替不可材料が不足している場合は必ずlacking
    const hasNoSubstituteMissing = missing.some(m => NO_SUBSTITUTE.has(m));
    let category;
    if (hasNoSubstituteMissing || missing.length > 2) {
      category = "lacking";
    } else if (missing.length === 0) {
      category = "perfect";
    } else {
      category = "almost";
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

// ─────────────────────────────────────
// 派生レシピのマッチング
// ─────────────────────────────────────
export function matchVariations(userIngredients, variations, matchedProfiles) {
  const normalized = normalizeUserIngredients([
    ...userIngredients,
    ...BASE_ALWAYS_HAVE,
  ]);

  // マッチした生地タイプを取得
  const availableDoughTypes = new Set(
    matchedProfiles
      .filter(m => m.category === "perfect" || m.category === "almost")
      .map(m => m.profile.dough_type)
      .filter(Boolean)
  );

  const results = [];

  for (const variation of variations) {
    // この生地タイプが作れるか確認
    if (!availableDoughTypes.has(variation.base_dough_type)) continue;

    // 必須具材が揃っているか確認
    const missingRequired = (variation.requires || []).filter(
      req => !hasIngredient(normalized, req)
    );

    // 任意具材のマッチ数
    const matchedOptional = (variation.optional || []).filter(
      opt => hasIngredient(normalized, opt)
    );

    let category;
    if (missingRequired.length === 0) {
      category = "perfect";
    } else if (missingRequired.length <= 1) {
      category = "almost";
    } else {
      continue; // 2つ以上足りない場合はスキップ
    }

    // ベースとなるプロファイルを取得
    const baseProfile = matchedProfiles.find(
      m => m.profile.dough_type === variation.base_dough_type
        && (m.category === "perfect" || m.category === "almost")
    );

    results.push({
      variation,
      baseProfile: baseProfile?.profile,
      category,
      missing: missingRequired,
      matchedOptional,
      isVariation: true,
    });
  }

  // perfectを優先してスコア順にソート
  return results.sort((a, b) => {
    const catOrder = { perfect: 0, almost: 1 };
    if (catOrder[a.category] !== catOrder[b.category]) {
      return catOrder[a.category] - catOrder[b.category];
    }
    return b.matchedOptional.length - a.matchedOptional.length;
  });
}

// ─────────────────────────────────────
// コンポーネント（パーツ）のマッチング
// ─────────────────────────────────────
export function matchComponents(userIngredients, components) {
  const normalized = normalizeUserIngredients(userIngredients);

  return components.map(comp => {
    const required = comp.required_ingredients || [];
    const missing = required.filter(req => !hasIngredient(normalized, req));

    let category;
    if (missing.length === 0) {
      category = "perfect";
    } else if (missing.length === 1) {
      category = "almost";
    } else {
      category = "lacking";
    }

    return {
      component: comp,
      category,
      missing,
    };
  });
}

// ─────────────────────────────────────
// パン（完成品）のマッチング：生地 + コンポーネント
// ─────────────────────────────────────
export function matchBreads(matchedProfiles, matchedComponents, breads) {
  const results = [];

  for (const bread of breads) {
    // 1. 生地（Dough）のチェック
    const doughProfile = matchedProfiles.find(m => m.profile.dough_type === bread.dough_type);
    if (!doughProfile || doughProfile.category === "lacking") continue;

    // 2. 必要なコンポーネント（Components）のチェック
    const requiredComponentIds = bread.component_ids || [];
    const breadComponents = requiredComponentIds.map(id => 
      matchedComponents.find(mc => mc.component.id === id)
    ).filter(Boolean);

    // 必要なコンポーネント数と一致するか（DB不整合対策）
    if (breadComponents.length !== requiredComponentIds.length) continue;

    // 全てのコンポーネントが揃っているか確認
    const allComponentsPerfect = breadComponents.length > 0 && breadComponents.every(c => c.category === "perfect");
    const anyComponentLacking = breadComponents.some(c => c.category === "lacking");

    if (anyComponentLacking) continue;

    let category;
    if (doughProfile.category === "perfect" && allComponentsPerfect) {
      category = "perfect";
    } else {
      category = "almost";
    }

    // 欠落している材料を収集
    const missing = [
      ...doughProfile.missing,
      ...breadComponents.flatMap(c => c.missing)
    ];

    results.push({
      bread,
      doughProfile: doughProfile.profile,
      components: breadComponents.map(c => c.component),
      category,
      missing: Array.from(new Set(missing)), // 重複削除
      isBread: true,
    });
  }

  return results.sort((a, b) => {
    const catOrder = { perfect: 0, almost: 1 };
    return catOrder[a.category] - catOrder[b.category];
  });
}
