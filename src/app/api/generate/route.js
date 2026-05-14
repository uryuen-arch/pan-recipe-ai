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
    const body = await request.json().catch(() => ({}));
    const { ingredients, conditions = [] } = body;

    if (!ingredients || typeof ingredients !== "string" || ingredients.trim().length < 2) {
      return Response.json(
        { error: "材料を具体的に入力してください（例：強力粉、塩、イースト）" },
        { status: 400 }
      );
    }

    const timeCondition = conditions.find(c => TIME_MAP[c])       || "1時間";
    const method        = conditions.find(c => METHOD_MAP[c])     || "オーブン";
    const difficulty    = conditions.find(c => DIFFICULTY_MAP[c]) || "簡単";

    const userIngredients = ingredients.split(/[,、\n]/).map(s => s.trim()).filter(Boolean);

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

    const fillingsText = `\n【具材指示】（最重要）
入力材料から重要な具材を5〜8個選別し、以下のみ出力：
- ratio：ベーカーズ%
- timing：タイミング（捏ね/成形/焼成前/仕上げ）
- inst：動作（15文字以内：例「生地に包む」）`;

    const exampleFilling = `[{"name":"具材","ratio":20,"timing":"成形","inst":"生地に包む"}]`;

    const prompt = `あなたはパン専門家です。3つのパンを提案してください。
入力材料：${ingredients}
条件：${timeCondition}, ${method}, ${difficulty}
対象プロファイル：\n${profileSummary}\n${fillingsText}

【ルール】
- レシピ名：日本語のみ
- キャッチコピー：15文字以内
- 具材(fillings)：入力材料にあるものと、ベース4項目以外の必須材料のみ。
- 材料選別：材料が多い場合は重要なものに絞る。

JSONのみ出力：
{
  "recipes": [
    {"name":"","catchcopy":"","fillings":${exampleFilling}},
    {"name":"","catchcopy":"","fillings":${exampleFilling}},
    {"name":"","catchcopy":"","fillings":${exampleFilling}}
  ]
}`;

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    if (completion.choices[0].finish_reason === "length") {
      return Response.json(
        { error: "AIの回答が途切れました。材料を減らしてお試しください。" },
        { status: 500 }
      );
    }

    const text = completion.choices[0].message.content;
    let aiData;
    try {
      aiData = JSON.parse(text);
    } catch (e) {
      console.error("AI JSON Parse Error. Raw text:", text);
      throw new Error("AIの回答を解析できませんでした。");
    }

    const servingsMap = { 250: "6個分", 300: "8個分", 350: "10個分" };

    const recipes = recipeConfigs.map((config, i) => {
      const ai = aiData.recipes?.[i] || aiData.recipes?.[0] || {};
      const { calc, steps, flourGrams, texture, isVariation } = config;

      const fillingsData = (ai.fillings || []).map(f => ({
        name:             f.name,
        grams:            Math.round(flourGrams * (f.ratio || 0) / 100),
        ratio:            f.ratio || 0,
        note:             null,
        timing:           f.timing || null,
        step_instruction: f.inst || null,
        isFilling:        true,
      }));

      // 工程に具材の使い方指示を統合
      const updatedSteps = steps.map(step => {
        const matchingFillings = fillingsData.filter(f => {
          if (!f.timing || !f.step_instruction) return false;
          const t = f.timing;
          const l = step.label;
          if (l === "混ぜる" && t.includes("混ぜ")) return true;
          if (l === "捏ね" && (t.includes("捏ね") || t.includes("合わせ"))) return true;
          if (l === "成形" && (t.includes("成形") || t.includes("巻き") || t.includes("包む") || t.includes("のせ"))) return true;
          if (l === "焼成" && t.includes("焼成")) return true;
          if (l === "仕上げ" && (t.includes("仕上げ") || t.includes("かけ"))) return true;
          return false;
        });

        if (matchingFillings.length > 0) {
          const instructions = matchingFillings.map(f => `【${f.name}】${f.step_instruction}`).join(" ");
          return { ...step, desc: `${step.desc} ${instructions}` };
        }
        return step;
      });

      const MUST_MATERIALS = ["強力粉", "塩", "水", "ドライイースト"];
      const displayBaseIngredients = calc.ingredients.filter(ing => !MUST_MATERIALS.includes(ing.name));

      const allIngredientsData = [...calc.ingredients, ...fillingsData];
      const allIngredients = [
        ...formatIngredients(displayBaseIngredients),
        ...fillingsData.map(f => `${f.name} ${f.grams}g`),
      ];

      return {
        name:            ai.name || "名称未設定のパン",
        catchcopy:       ai.catchcopy || "",
        feature:         config.profile?.description || "", // プロファイルから引用して節約
        recommend:       "", 
        point:           config.variationDesc || "丁寧に作業しましょう。", // 既存データから引用
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
        stepsData:       updatedSteps,
        steps:           updatedSteps.map(s => `【${s.label}】${s.desc}${s.time ? `（目安：${s.time}）` : ""}`),
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

    // クォータ（制限）エラーの判定
    if (error.status === 429) {
      return Response.json(
        { error: "AIの利用制限に達しました。しばらく時間を置いてから再度お試しください。" },
        { status: 429 }
      );
    }

    // ネットワークエラーの判定
    if (error.name === "FetchError" || error.code === "ECONNRESET") {
      return Response.json(
        { error: "ネットワーク接続エラーが発生しました。通信環境を確認してください。" },
        { status: 503 }
      );
    }

    return Response.json(
      { error: error.message.includes("AIの回答") ? error.message : "レシピの生成に失敗しました。もう一度お試しください。" },
      { status: error.status || 500 }
    );
  }
}
