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
  const trimmed = String(input || "").trim();
  for (const [canonical, aliases] of Object.entries(NORMALIZE_MAP)) {
    if (aliases.some(alias => trimmed.includes(alias)) || trimmed.includes(canonical)) {
      return canonical;
    }
  }
  return trimmed;
}

function normalizeUserIngredients(userIngredients) {
  return (userIngredients || []).map(normalizeIngredient);
}

function hasIngredient(normalizedList, target) {
  const normalizedTarget = normalizeIngredient(target);
  return (normalizedList || []).some(item =>
    item === normalizedTarget || item.includes(normalizedTarget) || normalizedTarget.includes(item)
  );
}

const BASE_ALWAYS_HAVE = ["強力粉", "イースト", "ドライイースト", "塩", "水", "砂糖"];
const NO_SUBSTITUTE = new Set(["卵", "バター"]);

export function matchRecipes(userIngredients, profiles) {
  const normalized = normalizeUserIngredients([...(userIngredients || []), ...BASE_ALWAYS_HAVE]);
  if (!Array.isArray(profiles)) return [];

  return profiles.map(profile => {
    let score = 0;
    const missing = [];
    const substituted = [];
    const matched = [];

    const required = profile.required_ingredients || [];
    const optional = profile.optional_ingredients || [];
    const subs = profile.substitutes || {};

    for (const req of required) {
      if (hasIngredient(normalized, req)) {
        score += 3;
        matched.push(req);
      } else if (NO_SUBSTITUTE.has(req)) {
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

    for (const opt of optional) {
      if (hasIngredient(normalized, opt)) {
        score += 1;
        matched.push(opt);
      }
    }

    const hasNoSubstituteMissing = missing.some(m => NO_SUBSTITUTE.has(m));
    let category;
    if (hasNoSubstituteMissing || missing.length > 2) category = "lacking";
    else if (missing.length === 0) category = "perfect";
    else category = "almost";

    return { profile, score, missing, substituted, matched, category };
  }).sort((a, b) => {
    const catOrder = { perfect: 0, almost: 1, lacking: 2 };
    if (catOrder[a.category] !== catOrder[b.category]) return catOrder[a.category] - catOrder[b.category];
    return b.score - a.score;
  });
}

const BASE_INGREDIENTS = new Set([
  "強力粉", "薄力粉", "全粒粉", "水", "牛乳", "豆乳", "バター", "マーガリン", "油", "オリーブオイル", "サラダ油",
  "砂糖", "塩", "イースト", "ドライイースト", "卵", "はちみつ", "蜂蜜", "メープル", "グラニュー糖", "上白糖",
]);

export function extractFillings(userIngredients) {
  return (userIngredients || []).filter(ing => {
    const normalized = normalizeIngredient(ing);
    return !BASE_INGREDIENTS.has(normalized) &&
           !Array.from(BASE_INGREDIENTS).some(base => ing.includes(base));
  });
}

export function getSubstituteNote(substituted) {
  if (!Array.isArray(substituted) || substituted.length === 0) return null;
  return substituted.map(s => `${s.original}の代わりに${s.substitute}を使用`).join("・");
}

export function matchVariations(userIngredients, variations, matchedProfiles) {
  const normalized = normalizeUserIngredients([...(userIngredients || []), ...BASE_ALWAYS_HAVE]);
  const availableDoughTypes = new Set((matchedProfiles || []).filter(m => m.category !== "lacking").map(m => m.profile.dough_type).filter(Boolean));

  const results = [];
  for (const variation of (variations || [])) {
    if (!availableDoughTypes.has(variation.base_dough_type)) continue;
    const missingRequired = (variation.requires || []).filter(req => !hasIngredient(normalized, req));
    const matchedOptional = (variation.optional || []).filter(opt => hasIngredient(normalized, opt));

    let category;
    if (missingRequired.length === 0) category = "perfect";
    else if (missingRequired.length <= 1) category = "almost";
    else category = "lacking";

    const baseProfile = matchedProfiles.find(m => m.profile.dough_type === variation.base_dough_type);
    results.push({ variation, baseProfile: baseProfile?.profile, category, missing: missingRequired, matchedOptional, isVariation: true });
  }

  return results.sort((a, b) => {
    const catOrder = { perfect: 0, almost: 1, lacking: 2 };
    return catOrder[a.category] - catOrder[b.category];
  });
}

export function matchComponents(userIngredients, components) {
  const normalized = normalizeUserIngredients([...(userIngredients || []), ...BASE_ALWAYS_HAVE]);
  return (components || []).map(comp => {
    const required = comp.required_ingredients || [];
    const missing = required.filter(req => !hasIngredient(normalized, req));
    let category;
    if (missing.length === 0) category = "perfect";
    else if (missing.length === 1) category = "almost";
    else category = "lacking";
    return { component: comp, category, missing };
  });
}

export function matchBreads(matchedProfiles, matchedComponents, breads, userIngredients = []) {
  const results = [];
  if (!Array.isArray(breads)) return [];

  const normalizedUserIngs = normalizeUserIngredients(userIngredients);
  const fillings = extractFillings(userIngredients);

  for (const bread of breads) {
    if (!bread) continue;
    const doughProfile = (matchedProfiles || []).find(m => 
      m.profile?.dough_type?.trim().toLowerCase() === bread.dough_type?.trim().toLowerCase()
    );
    if (!doughProfile) continue;

    const requiredIds = Array.isArray(bread.component_ids) ? bread.component_ids : [];
    const breadComponents = requiredIds.map(id => (matchedComponents || []).find(mc => mc.component?.id === id)).filter(Boolean);

    // アイデンティティ具材のチェック
    let identityMissing = false;
    const breadText = (bread.name + (bread.description || "")).toLowerCase();
    
    for (const [key, aliases] of Object.entries(IDENTITY_KEYWORDS)) {
      const hasKeyword = aliases.some(alias => breadText.includes(alias));
      if (hasKeyword) {
        // キーワードに合致する材料をユーザーが持っているか
        const userHasIdentity = aliases.some(alias => hasIngredient(normalizedUserIngs, alias)) ||
                               fillings.some(f => aliases.some(alias => f.includes(alias)));
        if (!userHasIdentity) {
          identityMissing = true;
          break;
        }
      }
    }

    let category;
    const anyLacking = breadComponents.some(c => c.category === "lacking");
    const anyAlmost = breadComponents.some(c => c.category === "almost");

    // アイデンティティ具材がない場合は強制的にlackingにする
    if (identityMissing || doughProfile.category === "lacking" || anyLacking) category = "lacking";
    else if (doughProfile.category === "almost" || anyAlmost) category = "almost";
    else category = "perfect";

    const bonus = fillings.filter(f => 
      (bread.name?.includes(f) || bread.description?.includes(f)) ||
      breadComponents.some(bc => bc.component?.name?.includes(f) || bc.component?.description?.includes(f))
    ).length;

    // 生地タイプ（強力粉・薄力粉など）のマッチングボーナス
    const doughMatchBonus = hasIngredient(normalizedUserIngs, doughProfile.profile?.type) ? 2 : 0;

    results.push({
      bread, doughProfile: doughProfile.profile, components: breadComponents.map(c => c.component),
      category, missing: Array.from(new Set([...(doughProfile.missing || []), ...breadComponents.flatMap(c => c.missing || [])])),
      isBread: true, score: (doughProfile.score || 0) + (bonus * 10) + doughMatchBonus
    });
  }

  return results.sort((a, b) => {
    const catOrder = { perfect: 0, almost: 1, lacking: 2 };
    if (catOrder[a.category] !== catOrder[b.category]) return catOrder[a.category] - catOrder[b.category];
    return b.score - a.score;
  });
}
- a.score;
  });
}
