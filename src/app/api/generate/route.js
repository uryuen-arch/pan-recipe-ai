import Groq from "groq-sdk";
import { calcRecipe, formatIngredients } from "../../../lib/baker";
import { getStepsTemplate } from "../../../lib/steps";
import { matchRecipes, matchVariations, extractFillings, getSubstituteNote } from "../../../lib/matcher";
import { createClient } from "@supabase/supabase-js";

const client = new Groq();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TIME_MAP       = { "30分以内": "30分以内", "1時間": "1時間", "一晩": "一晩" };
const METHOD_MAP     = { "オーブン": "オーブン", "フライパン": "フライパン", "ホームベーカリー": "ホームベーカリー", "トースター": "トースター" };
const DIFFICULTY_MAP = { "超簡単": "超簡単", "簡単": "簡単", "本格": "本格" };

// 派生レシピとベースレシピを組み合わせてtop3を選択
function selectTop3(matchedVariations, matchedProfiles) {
  const result = [];
  const usedDoughTypes = new Set();

  // 派生レシピを優先（perfectのみ）
  for (const v of matchedVariations.filter(v => v.category === "perfect")) {
    if (result.length >= 3) break;
    result.push({ ...v, type: "variation" });
    usedDoughTypes.add(v.variation.base_dough_type);
  }

  // 残りをベースレシピで埋める
  for (const m of matchedProfiles) {
    if (result.length >= 3) break;
    result.push({ ...m, type: "base" });
  }

  // almostの派生レシピも追加（枠が余っていれば）
  for (const v of matchedVariations.filter(v => v.category === "almost")) {
    if (result.length >= 3) break;
    result.push({ ...v, type: "variation" });
  }

  return result.slice(0, 3);
}

export async function POST(request) {
  try {
    const { ingredients, conditions } = await request.json();

    if (!ingredients || ingredients.trim() === "") {
      return Response.json({ error: "材料を入力してください" }, { status: 400 });
    }

    const timeCondition = conditions.find(c => TIME_MAP[c])       || "1時間";
    const method        = conditions.find(c => METHOD_MAP[c])     || "オーブン";
    const difficulty    = conditions.find(c => DIFFICULTY_MAP[c]) || "簡単";

    const userIngredients = ingredients.split(/[,、]/).map(s => s.trim()).filter(Boolean);

    // 条件を解析
    const textureConditions = conditions.filter(c => ["ふんわり", "しっとり", "ハード系"].includes(c));
    const texture = textureConditions[0] || null; // 選択された食感

    // DBから全プロファイルを取得（texture指定があれば絞り込む）
    let query = supabase
      .from("bread_profiles")
      .select("*")
      .eq("is_active", true)
      .eq("difficulty", difficulty);

    if (texture) {
      query = query.eq("texture", texture);
    }

    const { data: profiles, error } = await query;

    if (error) throw error;

    // マッチング実行
    const matched = matchRecipes(userIngredients, profiles);
    
    // variationsテーブルから派生レシピを取得
    const { data: variations } = await supabase
      .from("variations")
      .select("*");

    // 派生レシピのマッチング
    const matchedVariations = matchVariations(userIngredients, variations || [], matched);

    // 派生レシピを優先して上位3件を選択
    const top3 = selectTop3(matchedVariations, matched);

    // 具材を抽出
    const fillings = extractFillings(userIngredients);

    // 各プロファイルで配合と工程を計算
    const FLOUR_AMOUNTS = [250, 300, 350];
    const recipeConfigs = top3.map((item, i) => {
      const flourGrams = FLOUR_AMOUNTS[i] || 300;
      const isVariation = item.type === "variation";
      const profile = isVariation ? item.baseProfile : item.profile;
      const texture = profile?.texture || "ふんわり";
      const stepsType = isVariation
        ? (item.variation.steps_type || profile?.steps_type || "standard")
        : profile?.steps_type || "standard";

      const profileWithStepsType = { ...profile, steps_type: stepsType };
      const calc  = calcRecipe({ flourGrams, profile: profileWithStepsType, timeCondition, method, userIngredients });
      const steps = getStepsTemplate(texture, method, timeCondition, { ...calc, profile: profileWithStepsType });

      return {
        item,
        isVariation,
        profile: profileWithStepsType,
        calc,
        steps,
        flourGrams,
        texture,
        category:  item.category,
        missing:   item.missing || [],
        substituted: item.substituted || [],
        variationName: isVariation ? item.variation.variation_name : null,
        variationDesc: isVariation ? item.variation.description : null,
        stepsNote:     isVariation ? item.variation.steps_note : null,
      };
    });

    // AIには名前・コピー・ポイント・具材分量だけ生成
    const profileSummary = recipeConfigs.map((config, i) => {
      const name = config.isVariation ? config.variationName : config.profile?.type;
      const status = config.category === "perfect" ? "今すぐ作れる" : `${config.missing.join("・")}が必要`;
      return `${i + 1}. ${name}（${config.texture}・${status}${config.isVariation ? "・派生レシピ" : ""}）`;
    }).join("\n");

    const fillingsText = fillings.length > 0
      ? `\n【具材の分量・使い方指示】（必須）
以下の具材は必ずfillingsに追加してください：${fillings.join("・")}
各具材について以下を記載してください：
- grams：粉量300g基準の分量(g)
- ratio：ベーカーズ%
- note：下処理メモ（例：1cm幅に切る）
- timing：使うタイミング（「粉類と混ぜる」「捏ね後に折り込む」「成形時に巻き込む」「成形時に包む」「成形時にのせる」「焼成前にかける」のいずれか）
- step_instruction：工程への具体的な指示（例：「強力粉と一緒にボウルに入れてよく混ぜる」）
絶対に空配列[]にしないでください。`
      : "";

    const exampleFilling = fillings.length > 0
      ? `[{"name":"${fillings[0]}","grams":60,"ratio":20,"note":"下処理メモ","timing":"成形時に巻き込む","step_instruction":"生地を伸ばした後、${fillings[0]}を均等に散らして巻き込む"}]`
      : "[]";

    const prompt = `あなたはパン作りの専門家です。
以下の3種類のパンに対して、それぞれ名前とコピーを考えてください。

マッチしたパン：
${profileSummary}

条件：
- 時間：${timeCondition}
- 調理方法：${method}
- 難易度：${difficulty}
- 使用食材：${ingredients}
${fillingsText}

【レシピ名のルール】
- 日本語のみ（英語・カタカナ横文字は禁止）
- パンの種類名を含める（例：ふわふわミルクロール・バター香る食パン）
- 具材がある場合は具材名を含める（例：リンゴとレーズンのパン）
- 造語・横文字は禁止・シンプルで親しみやすい名前

3つそれぞれに以下を答えてください：
- name：レシピ名
- catchcopy：一言キャッチコピー（20文字以内）
- feature：特徴3つカンマ区切り
- recommend：他との比較で際立つ一言
- point：失敗しないコツ1〜2文
- fillings：具材リスト（timingとstep_instructionを必ず含める）

JSON形式のみ。バッククォートや説明文は不要です。
[
  {"name":"","catchcopy":"","feature":"","recommend":"","point":"","fillings":${exampleFilling}},
  {"name":"","catchcopy":"","feature":"","recommend":"","point":"","fillings":${exampleFilling}},
  {"name":"","catchcopy":"","feature":"","recommend":"","point":"","fillings":${exampleFilling}}
]`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0.8,
    });

    const text    = completion.choices[0].message.content;
    const cleaned = text.replace(/```json|```/g, "").trim();
    const aiData  = JSON.parse(cleaned);

    const servingsMap = { 250: "6個分", 300: "8個分", 350: "10個分" };

    const recipes = recipeConfigs.map((config, i) => {
      const ai = aiData[i] || aiData[0];
      const { calc, steps, flourGrams, texture, isVariation } = config;

      const fillingsData = (ai.fillings || []).map(f => ({
        name:             f.name,
        grams:            Math.round((f.grams || 0) * flourGrams / 300),
        ratio:            Math.round((f.ratio || 0) * flourGrams / 300 * 10) / 10,
        note:             f.note || null,
        timing:           f.timing || null,
        step_instruction: f.step_instruction || null,
        isFilling:        true,
      }));

      const allIngredientsData = [...calc.ingredients, ...fillingsData];
      const allIngredients = [
        ...formatIngredients(calc.ingredients),
        ...fillingsData.map(f => `${f.name} ${f.grams}g${f.note ? `（${f.note}）` : ""}`),
      ];

      return {
        name:            ai.name,
        catchcopy:       ai.catchcopy,
        feature:         ai.feature,
        recommend:       ai.recommend,
        point:           ai.point,
        fillings:        fillingsData,
        isVariation,
        variationName:   config.variationName,
        variationDesc:   config.variationDesc,
        stepsNote:       config.stepsNote,
        category:        config.category,
        missing:         config.missing,
        substituted:     config.substituted || [],
        substituteNote:  getSubstituteNote(config.substituted || []),
        texture,
        time:            timeCondition === "一晩"     ? "翌日完成（仕込み15分）" :
                         timeCondition === "30分以内" ? "約30分" : "約1時間",
        servings:        servingsMap[flourGrams] || "8個分",
        difficulty_level: difficulty,
        method,
        flourGrams,
        sweetness:       texture === "ふんわり" ? "甘め" : texture === "ハード系" ? "控えめ" : "中程度",
        ingredientsData: allIngredientsData,
        ingredients:     allIngredients,
        stepsData:       steps,
        steps:           steps.map(s => `【${s.label}】${s.desc}${s.time ? `（目安：${s.time}）` : ""}`),
        fermentation:    calc.fermentation,
        fermentConfig:   calc.fermentConfig,
        bakingConfig:    calc.bakingConfig,
        yeastRatio:      calc.yeastRatio,
        profileType:     config.profile?.type,
      };
    });

    return Response.json({ recipes });
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { error: "レシピの生成に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
