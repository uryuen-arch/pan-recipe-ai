// ─────────────────────────────────────
// ベーカーズパーセント定義
// 食感×調理方法の組み合わせで配合を決定
// ─────────────────────────────────────

const BASE_RATIOS = {
  "ふんわり": {
    water:  0,
    milk:   65,
    butter: 10,
    sugar:  8,
    salt:   2,
    yeast:  1.5,
    egg:    0,
  },
  "しっとり": {
    water:  0,
    milk:   60,
    butter: 15,
    sugar:  6,
    salt:   2,
    yeast:  1.5,
    egg:    10,
  },
  "ハード系": {
    water:  75,
    milk:   0,
    butter: 0,
    sugar:  2,
    salt:   2,
    yeast:  0.8,
    egg:    0,
  },
};

// 時間条件によるイースト量補正
const YEAST_MULTIPLIER = {
  "30分以内": 2.0,
  "1時間":    1.5,
  "一晩":     0.3,
};

// 発酵条件
const FERMENTATION_CONFIG = {
  "30分以内": {
    first:  { temp: 38, time: 15 },
    second: { temp: 40, time: 10 },
    note:   "イースト量を2倍にして高温短時間発酵",
  },
  "1時間": {
    first:  { temp: 30, time: 30 },
    second: { temp: 35, time: 20 },
    note:   "イースト量1.5倍で時短発酵",
  },
  "一晩": {
    first:  { temp: 5,  time: 480 },
    second: { temp: 35, time: 40 },
    note:   "冷蔵低温長時間発酵（8時間）で風味豊かに",
  },
  "default": {
    first:  { temp: 28, time: 60 },
    second: { temp: 35, time: 30 },
    note:   "標準発酵",
  },
};

// 焼成条件
const BAKING_CONFIG = {
  "オーブン": {
    "ふんわり":  { temp: 180, time: 15 },
    "しっとり":  { temp: 175, time: 18 },
    "ハード系":  { temp: 230, time: 25 },
  },
  "フライパン": {
    "ふんわり":  { temp: null, time: 8,  note: "弱火〜中火" },
    "しっとり":  { temp: null, time: 10, note: "弱火" },
    "ハード系":  { temp: null, time: 12, note: "中火" },
  },
  "トースター": {
    "ふんわり":  { temp: 160, time: 12 },
    "しっとり":  { temp: 160, time: 14 },
    "ハード系":  { temp: 200, time: 15 },
  },
  "ホームベーカリー": {
    "ふんわり":  { temp: null, time: null, note: "食パンコースで自動" },
    "しっとり":  { temp: null, time: null, note: "食パンコースで自動" },
    "ハード系":  { temp: null, time: null, note: "フランスパンコースで自動" },
  },
};

// ─────────────────────────────────────
// メイン：配合を計算して返す
// ─────────────────────────────────────
export function calcRecipe({
  flourGrams = 300,
  texture = "ふんわり",
  timeCondition = "1時間",
  method = "オーブン",
  userIngredients = [],
}) {
  const ratio = BASE_RATIOS[texture] || BASE_RATIOS["ふんわり"];
  const yeastMult = YEAST_MULTIPLIER[timeCondition] || 1.0;
  const ferment = FERMENTATION_CONFIG[timeCondition] || FERMENTATION_CONFIG["default"];
  const baking = (BAKING_CONFIG[method] || BAKING_CONFIG["オーブン"])[texture]
               || BAKING_CONFIG["オーブン"]["ふんわり"];

  // ユーザー食材に卵があれば卵を追加
  const hasEgg = userIngredients.some(i => i.includes("卵") || i.includes("egg"));
  const eggRatio = hasEgg ? (ratio.egg || 10) : 0;

  // ミルクに卵分を含める場合は調整
  const milkRatio = ratio.milk;

  // イースト補正
  const yeastRatio = Math.round(ratio.yeast * yeastMult * 10) / 10;

  // 各材料のグラム数を計算
  const ingredients = [];

  ingredients.push({ name: "強力粉", grams: flourGrams, ratio: 100 });

  if (milkRatio > 0) {
    const g = Math.round(flourGrams * milkRatio / 100);
    ingredients.push({ name: "牛乳", grams: g, unit: "ml", ratio: milkRatio });
  }
  if (ratio.water > 0) {
    const g = Math.round(flourGrams * ratio.water / 100);
    ingredients.push({ name: "水", grams: g, unit: "ml", ratio: ratio.water, note: "人肌程度に温める" });
  }
  if (hasEgg && eggRatio > 0) {
    const g = Math.round(flourGrams * eggRatio / 100);
    ingredients.push({ name: "卵", grams: g, unit: "g（約M玉1個）", ratio: eggRatio });
  }
  if (ratio.butter > 0) {
    const g = Math.round(flourGrams * ratio.butter / 100);
    ingredients.push({ name: "無塩バター", grams: g, ratio: ratio.butter, note: "室温に戻す" });
  }
  if (ratio.sugar > 0) {
    const g = Math.round(flourGrams * ratio.sugar / 100);
    ingredients.push({ name: "砂糖", grams: g, ratio: ratio.sugar });
  }
  if (ratio.salt > 0) {
    const g = Math.round(flourGrams * ratio.salt / 100);
    ingredients.push({ name: "塩", grams: g, ratio: ratio.salt });
  }

  ingredients.push({
    name: "ドライイースト",
    grams: Math.round(flourGrams * yeastRatio / 100 * 10) / 10,
    ratio: yeastRatio,
    note: timeCondition === "30分以内" ? "通常の2倍量で時短" :
          timeCondition === "一晩" ? "少量で低温長時間発酵" : null,
  });

  // 発酵テキスト
  const fermentText = timeCondition === "一晩"
    ? `冷蔵（5℃）・8時間 / 二次発酵 ${ferment.second.temp}℃・${ferment.second.time}分`
    : `一次発酵 ${ferment.first.temp}℃・${ferment.first.time}分 / 二次発酵 ${ferment.second.temp}℃・${ferment.second.time}分`;

  // 焼成テキスト
  const bakingText = baking.temp
    ? `${baking.temp}℃・${baking.time}分`
    : baking.note || "自動";

  return {
    ingredients,
    fermentation: fermentText,
    fermentConfig: ferment,
    bakingConfig: baking,
    bakingText,
    yeastRatio,
    timeCondition,
    texture,
    method,
  };
}

// 材料リストを表示用文字列に変換
export function formatIngredients(ingredients) {
  return ingredients.map(ing => {
    const unit = ing.unit || "g";
    const note = ing.note ? `（${ing.note}）` : "";
    return `${ing.name} ${ing.grams}${unit}${note}`;
  });
}
