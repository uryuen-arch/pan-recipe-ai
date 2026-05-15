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
// 具材混ぜ込み（練り込み）時の自動調整用データ
// ─────────────────────────────────────
export const PASTE_ADJUSTMENTS = {
  "バナナ":    { liquidFactor: 0.3, sugarFactor: 0.3 },
  "かぼちゃ":  { liquidFactor: 0.2, sugarFactor: 0.1 },
  "さつまいも": { liquidFactor: 0.0, sugarFactor: 0.2 },
  "ほうれん草": { liquidFactor: 0.3, sugarFactor: 0.0 },
  "にんじん":  { liquidFactor: 0.1, sugarFactor: 0.0 },
  "トマト":    { liquidFactor: 0.4, sugarFactor: 0.0 },
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
  const baking = getBakingConfig(profile, method);

  // ユーザーの所持材料を確認
  const hasMilk = userIngredients.some(i => i.includes("牛乳") || i.includes("ミルク"));
  const hasEgg = userIngredients.some(i => i.includes("卵") || i.includes("egg"));
  const hasMargarine = userIngredients.some(i => i.includes("マーガリン"));
  const hasSaltedButter = userIngredients.some(i => i.includes("有塩バター"));

  // 水分量の計算（基本の水 + 牛乳 + 卵の合計水分量を調整）
  let targetWaterRatio = (profile.water || 0) + (profile.milk || 0);
  let finalIngredients = [];

  // 1. 強力粉 / 全粒粉
  if (profile.whole_wheat > 0) {
    const wwGrams = Math.round(flourGrams * profile.whole_wheat / 100);
    finalIngredients.push({ name: "強力粉", grams: flourGrams - wwGrams, ratio: 100 - profile.whole_wheat });
    finalIngredients.push({ name: "全粒粉", grams: wwGrams, ratio: profile.whole_wheat });
  } else {
    finalIngredients.push({ name: "強力粉", grams: flourGrams, ratio: 100 });
  }

  // 2. 水分（牛乳優先置換）
  if (hasMilk && targetWaterRatio > 0) {
    // 水を牛乳に置き換える (水×1.1)
    const milkRatio = Math.round(targetWaterRatio * 1.1 * 10) / 10;
    const milkGrams = Math.round(flourGrams * milkRatio / 100);
    finalIngredients.push({ name: "牛乳", grams: milkGrams, unit: "ml", ratio: milkRatio, note: "人肌に温める" });
  } else if (targetWaterRatio > 0) {
    const waterGrams = Math.round(flourGrams * targetWaterRatio / 100);
    finalIngredients.push({ name: "水", grams: waterGrams, unit: "ml", ratio: targetWaterRatio, note: "人肌に温める" });
  }

  // 3. 卵（水分の一部として扱うか、追加リッチ材料として扱うか）
  if (hasEgg && (profile.egg || 0) > 0) {
    const eggGrams = Math.round(flourGrams * profile.egg / 100);
    finalIngredients.push({ name: "卵", grams: eggGrams, unit: "g", ratio: profile.egg });
  }

  // 4. 油脂（バター / 有塩バター / マーガリン / オリーブオイル）
  const butterRatio = profile.butter || 0;
  if (butterRatio > 0) {
    let name = "無塩バター";
    let note = "室温に戻す";
    if (hasSaltedButter) { name = "有塩バター"; note = "室温に戻す（生地の塩を少し減らすと◎）"; }
    else if (hasMargarine) { name = "マーガリン"; note = "室温に戻す"; }
    finalIngredients.push({ name, grams: Math.round(flourGrams * butterRatio / 100), ratio: butterRatio, note });
  } else if ((profile.oliveoil || 0) > 0) {
    finalIngredients.push({ name: "オリーブオイル", grams: Math.round(flourGrams * profile.oliveoil / 100), unit: "ml", ratio: profile.oliveoil });
  }

  // 5. 砂糖・塩・イースト
  const isHard = profile.texture === "ハード系";
  const hasMaltPowder = userIngredients.some(i => i.includes("モルトパウダー"));
  const hasMaltSyrup = userIngredients.some(i => i.includes("モルトシロップ") || i.includes("モルトエキス"));

  if (isHard && (hasMaltPowder || hasMaltSyrup)) {
    // ハード系でモルトがある場合、砂糖を0にしてモルトを追加
    if (hasMaltSyrup) {
      finalIngredients.push({ 
        name: "モルトシロップ", 
        grams: Math.round(flourGrams * 0.5 / 100 * 10) / 10, 
        ratio: 0.5, 
        note: "イーストの働きを助け、風味と焼き色を向上させます" 
      });
    } else {
      finalIngredients.push({ 
        name: "モルトパウダー", 
        grams: Math.round(flourGrams * 0.1 / 100 * 10) / 10, 
        ratio: 0.1, 
        note: "イーストの働きを助け、風味と焼き色を向上させます" 
      });
    }
  } else {
    if ((profile.sugar || 0) > 0) finalIngredients.push({ name: "砂糖", grams: Math.round(flourGrams * profile.sugar / 100), ratio: profile.sugar });
  }

  if ((profile.salt || 0) > 0) finalIngredients.push({ name: "塩", grams: Math.round(flourGrams * profile.salt / 100), ratio: profile.salt });

  const yeastRatio = Math.round(profile.yeast * yeastMult * 10) / 10;
  finalIngredients.push({
    name: "ドライイースト",
    grams: Math.round(flourGrams * yeastRatio / 100 * 10) / 10,
    ratio: yeastRatio,
    note: timeCondition === "30分以内" ? "時短のため多め" : timeCondition === "一晩" ? "長時間発酵のため少なめ" : null
  });

  const fermentText = timeCondition === "一晩"
    ? `冷蔵（5℃）・8〜12時間 / 二次発酵 ${ferment.second.temp}℃・${ferment.second.time}分`
    : `一次発酵 ${ferment.first.temp}℃・${ferment.first.time}分 / 二次発酵 ${ferment.second.temp}℃・${ferment.second.time}分`;

  return {
    profile,
    ingredients: finalIngredients,
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
