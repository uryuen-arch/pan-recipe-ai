import { supabase } from "./supabase";

// ─────────────────────────────────────
// DBからプロファイルを取得
// ─────────────────────────────────────
export async function fetchProfile(texture, difficulty) {
  const { data, error } = await supabase
    .from("bread_profiles")
    .select("*")
    .eq("texture", texture)
    .eq("difficulty", difficulty)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.warn("Profile not found, using default:", texture, difficulty);
    return getDefaultProfile();
  }
  return data;
}

// ─────────────────────────────────────
// デフォルトプロファイル（DB取得失敗時）
// ─────────────────────────────────────
function getDefaultProfile() {
  return {
    type: "ロールパン",
    description: "バランスのよいロールパン配合",
    water: 0, milk: 63, butter: 10, oliveoil: 0,
    sugar: 8, salt: 2, yeast: 1.5, egg: 0, whole_wheat: 0,
    baking_temp_oven: 180, baking_time_oven: 15,
    baking_temp_toaster: 160, baking_time_toaster: 12,
    baking_note_pan: "弱火〜中火（片面8分・裏5分）",
    baking_note_hb: "食パンコースで自動",
  };
}

// ─────────────────────────────────────
// 時間条件によるイースト量補正
// ─────────────────────────────────────
const YEAST_MULTIPLIER = {
  "30分以内": 2.0,
  "1時間":    1.5,
  "一晩":     0.3,
};

// ─────────────────────────────────────
// 発酵条件
// ─────────────────────────────────────
const FERMENTATION_CONFIG = {
  "30分以内": {
    first:  { temp: 38, time: 15 },
    second: { temp: 40, time: 10 },
  },
  "1時間": {
    first:  { temp: 30, time: 30 },
    second: { temp: 35, time: 20 },
  },
  "一晩": {
    first:  { temp: 5,  time: 480 },
    second: { temp: 35, time: 40 },
  },
  "default": {
    first:  { temp: 28, time: 60 },
    second: { temp: 35, time: 30 },
  },
};

// ─────────────────────────────────────
// メイン：配合を計算して返す（DB版）
// ─────────────────────────────────────
export function calcRecipe({
  flourGrams = 300,
  profile,
  timeCondition = "1時間",
  method = "オーブン",
  userIngredients = [],
}) {
  const yeastMult   = YEAST_MULTIPLIER[timeCondition] || 1.0;
  const ferment     = FERMENTATION_CONFIG[timeCondition] || FERMENTATION_CONFIG["default"];

  // 焼成条件をDBから取得
  const baking = getBakingConfig(profile, method);

  // ユーザー食材に卵があれば追加
  const hasEgg = userIngredients.some(i => i.includes("卵") || i.includes("egg"));
  const eggRatio = hasEgg ? (profile.egg || 0) : 0;

  // イースト補正
  const yeastRatio = Math.round(profile.yeast * yeastMult * 10) / 10;

  // 材料リストを構築
  const ingredients = [];

  // 全粒粉混合
  if (profile.whole_wheat > 0) {
    const wwGrams = Math.round(flourGrams * profile.whole_wheat / 100);
    const bfGrams = flourGrams - wwGrams;
    ingredients.push({ name: "強力粉",  grams: bfGrams, ratio: 100 - profile.whole_wheat });
    ingredients.push({ name: "全粒粉",  grams: wwGrams, ratio: profile.whole_wheat, note: `強力粉の${profile.whole_wheat}%` });
  } else {
    ingredients.push({ name: "強力粉", grams: flourGrams, ratio: 100 });
  }

  if ((profile.milk || 0) > 0) {
    const g = Math.round(flourGrams * profile.milk / 100);
    ingredients.push({ name: "牛乳", grams: g, unit: "ml", ratio: profile.milk, note: "人肌程度に温める" });
  }
  if ((profile.water || 0) > 0) {
    const g = Math.round(flourGrams * profile.water / 100);
    ingredients.push({ name: "水", grams: g, unit: "ml", ratio: profile.water, note: "人肌（30℃程度）に温める" });
  }
  if ((profile.oliveoil || 0) > 0) {
    const g = Math.round(flourGrams * profile.oliveoil / 100);
    ingredients.push({ name: "オリーブオイル", grams: g, unit: "ml", ratio: profile.oliveoil });
  }
  if (hasEgg && eggRatio > 0) {
    const g = Math.round(flourGrams * eggRatio / 100);
    ingredients.push({ name: "卵", grams: g, unit: "g（約M玉1個）", ratio: eggRatio });
  }
  if ((profile.butter || 0) > 0) {
    const g = Math.round(flourGrams * profile.butter / 100);
    ingredients.push({ name: "無塩バター", grams: g, ratio: profile.butter, note: "室温に戻す" });
  }
  if ((profile.sugar || 0) > 0) {
    const g = Math.round(flourGrams * profile.sugar / 100);
    ingredients.push({ name: "砂糖", grams: g, ratio: profile.sugar });
  }
  if ((profile.salt || 0) > 0) {
    const g = Math.round(flourGrams * profile.salt / 100);
    ingredients.push({ name: "塩", grams: g, ratio: profile.salt });
  }
  ingredients.push({
    name: "ドライイースト",
    grams: Math.round(flourGrams * yeastRatio / 100 * 10) / 10,
    ratio: yeastRatio,
    note: timeCondition === "30分以内" ? "通常の2倍量で時短" :
          timeCondition === "一晩"     ? "少量で低温長時間発酵" : null,
  });

  // 発酵テキスト
  const fermentText = timeCondition === "一晩"
    ? `冷蔵（5℃）・8〜12時間 / 二次発酵 ${ferment.second.temp}℃・${ferment.second.time}分`
    : `一次発酵 ${ferment.first.temp}℃・${ferment.first.time}分 / 二次発酵 ${ferment.second.temp}℃・${ferment.second.time}分`;

  return {
    profile,
    ingredients,
    fermentation: fermentText,
    fermentConfig: ferment,
    bakingConfig:  baking,
    yeastRatio,
    timeCondition,
    method,
  };
}

// 調理方法に応じた焼成条件をDBプロファイルから取得
function getBakingConfig(profile, method) {
  switch (method) {
    case "オーブン":
      return {
        temp: profile.baking_temp_oven,
        time: profile.baking_time_oven,
        note: null,
      };
    case "トースター":
      return {
        temp: profile.baking_temp_toaster,
        time: profile.baking_time_toaster,
        note: null,
      };
    case "フライパン":
      return {
        temp: null,
        time: null,
        note: profile.baking_note_pan,
      };
    case "ホームベーカリー":
      return {
        temp: null,
        time: null,
        note: profile.baking_note_hb,
      };
    default:
      return {
        temp: profile.baking_temp_oven,
        time: profile.baking_time_oven,
        note: null,
      };
  }
}

// 材料リストを表示用文字列に変換
export function formatIngredients(ingredients) {
  return ingredients.map(ing => {
    const unit = ing.unit || "g";
    const note = ing.note ? `（${ing.note}）` : "";
    return `${ing.name} ${ing.grams}${unit}${note}`;
  });
}
