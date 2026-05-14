import Groq from "groq-sdk";
import { calcRecipe, formatIngredients, PASTE_ADJUSTMENTS } from "../../../lib/baker";
import { getStepsTemplate } from "../../../lib/steps";
import { matchRecipes, matchVariations, extractFillings, getSubstituteNote, matchComponents, matchBreads } from "../../../lib/matcher";
import { createClient } from "@supabase/supabase-js";

const client = new Groq();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TIME_MAP       = { "30分以内": "30分以内", "1時間": "1時間", "一晩": "一晩" };
const METHOD_MAP     = { "オーブン": "オーブン", "フライパン": "フライパン", "ホームベーカリー": "ホームベーカリー", "トースター": "トースター" };
const DIFFICULTY_MAP = { "超簡単": "超簡単", "簡単": "簡単", "本格": "本格" };

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

    // 1. 各種マスタデータの取得
    const difficultyLevel = difficulty === "本格" ? ["本格", "簡単", "超簡単"] : 
                           difficulty === "簡単" ? ["簡単", "超簡単"] : ["超簡単"];

    const [profilesRes, componentsRes, breadsRes] = await Promise.all([
      supabase.from("bread_profiles").select("*").eq("is_active", true).in("difficulty", difficultyLevel),
      supabase.from("components").select("*"),
      supabase.from("breads").select("*").in("difficulty", difficultyLevel)
    ]);

    if (profilesRes.error) throw profilesRes.error;
    
    // 2. マッチングエンジンの実行
    const matchedProfiles = matchRecipes(userIngredients, profilesRes.data);
    const matchedComponents = matchComponents(userIngredients, componentsRes.data || []);
    const matchedBreadsList = matchBreads(matchedProfiles, matchedComponents, breadsRes.data || []);

    // 3. 提案候補の選択（上位3件）
    // Bread成立分を優先し、足りない分はベース生地プロファイルで補う
    let finalSelection = matchedBreadsList.slice(0, 3).map(b => ({ ...b, type: "bread" }));
    
    if (finalSelection.length < 3) {
      const remainingCount = 3 - finalSelection.length;
      const baseOptions = matchedProfiles
        .filter(p => !finalSelection.some(f => f.doughProfile.id === p.profile.id))
        .slice(0, remainingCount)
        .map(p => ({ ...p, type: "base" }));
      finalSelection = [...finalSelection, ...baseOptions];
    }

    // 4. レシピ構成の組み立て
    const FLOUR_AMOUNTS = [250, 300, 350];
    const recipeConfigs = finalSelection.map((item, i) => {
      const flourGrams = FLOUR_AMOUNTS[i] || 300;
      const isBread = item.type === "bread";
      const profile = isBread ? item.doughProfile : item.profile;
      const texture = profile?.texture || "ふんわり";
      const stepsType = isBread ? item.bread.steps_type : profile?.steps_type || "standard";

      const profileWithStepsType = { ...profile, steps_type: stepsType };
      const calc = calcRecipe({ flourGrams, profile: profileWithStepsType, timeCondition, method, userIngredients });
      let baseSteps = getStepsTemplate(texture, method, timeCondition, { ...calc, profile: profileWithStepsType });

      // コンポーネントがある場合、その工程を「下準備」ステップに統合
      if (isBread && item.components && item.components.length > 0) {
        const componentInstructions = item.components.flatMap(c => 
          (c.recipe_steps || []).map(step => `【${c.name}作り】${step}`)
        );
        const prepStep = baseSteps.find(s => s.label === "下準備");
        if (prepStep) prepStep.desc += " " + componentInstructions.join(" ");
      }

      return {
        item,
        isBread,
        profile: profileWithStepsType,
        calc,
        steps: baseSteps,
        flourGrams,
        texture,
        category: item.category,
        missing: item.missing || [],
        breadName: isBread ? item.bread.name : null,
        breadDesc: isBread ? item.bread.description : null,
        components: isBread ? item.components : [],
      };
    });

    const profileSummary = recipeConfigs.map((config, i) => {
      const name = config.isBread ? config.breadName : config.profile?.type;
      const status = config.category === "perfect" ? "今すぐ作れる" : `${config.missing.join("・")}が必要`;
      return `${i + 1}. ${name}（${config.texture}・${status}${config.isBread ? "・パーツ作成あり" : ""}）`;
    }).join("\n");

    const fillingsText = `\n【具材・副資材指示】（最重要）
1. 「入力材料」の中から、パンを特徴づける具材を選別してください。
2. ペースト状にできる食材（バナナ、かぼちゃ等）は「捏ね」のタイミングで「生地に練り込む」提案を優先してください。
3. 調理方法が「揚げ物」の場合、表面トッピングは禁止。必ず「捏ね」か「成形」、または揚げた後の「仕上げ」にしてください。
4. 全ての具材について、必ず「timing」と「inst」を出力してください。
5. 出力項目：
- name：具材名
- ratio：ベーカーズ%
- timing：タイミング（混ぜる/捏ね/一次発酵/成形/焼成前/仕上げ）
- inst：動作（15文字以内）`;

    const exampleFilling = `[{"name":"バナナ","ratio":25,"timing":"捏ね","inst":"潰して生地に練り込む"}]`;

    const prompt = `あなたはパン専門家です。3つのパンを提案してください。
入力材料：${ingredients}
条件：${timeCondition}, ${method}, ${difficulty}
対象パン：\n${profileSummary}\n${fillingsText}

【ルール】
- レシピ名：提示された「対象パン」に基づき日本語で命名。
- キャッチコピー：15文字以内
- 具材(fillings)：入力材料にあり、かつ生地の基本材料ではないもの。

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
      return Response.json({ error: "AIの回答が途切れました。" }, { status: 500 });
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
      const { calc, steps, flourGrams, texture, isBread } = config;

      const BASE_MATERIAL_NAMES = ["強力粉", "薄力粉", "全粒粉", "塩", "水", "ドライイースト", "牛乳", "ミルク", "卵", "無塩バター", "有塩バター", "バター", "マーガリン", "オリーブオイル", "砂糖"];

      const rawFillings = (ai.fillings || [])
        .filter(f => !BASE_MATERIAL_NAMES.some(base => f.name.includes(base) && !f.inst.includes("トッピング") && !f.inst.includes("仕上げ")));

      let liquidReduction = 0;
      let sugarReduction = 0;

      const fillingsData = rawFillings.map(f => {
        const grams = Math.round(flourGrams * (f.ratio || 0) / 100);
        if (f.timing === "捏ね" || f.inst.includes("練り込む")) {
          const adj = PASTE_ADJUSTMENTS[f.name] || Object.entries(PASTE_ADJUSTMENTS).find(([k]) => f.name.includes(k))?.[1];
          if (adj) {
            liquidReduction += (f.ratio || 0) * adj.liquidFactor;
            sugarReduction += (f.ratio || 0) * adj.sugarFactor;
          }
        }
        return { name: f.name, grams, ratio: f.ratio || 0, timing: f.timing || null, step_instruction: f.inst || null, isFilling: true };
      });

      const adjustedBaseIngredients = calc.ingredients.map(ing => {
        let newGrams = ing.name === "牛乳" || ing.name === "水" ? Math.max(0, ing.grams - Math.round(flourGrams * liquidReduction / 100)) :
                       ing.name === "砂糖" ? Math.max(0, ing.grams - Math.round(flourGrams * sugarReduction / 100)) : ing.grams;
        const note = (ing.name === "牛乳" || ing.name === "水") && liquidReduction > 0 ? "（具材の水分分を減らして調整）" :
                     ing.name === "砂糖" && sugarReduction > 0 ? "（具材の糖分分を減らして調整）" : ing.note;
        return { ...ing, grams: newGrams, note };
      });

      const updatedSteps = steps.map(step => {
        const matchingFillings = fillingsData.filter(f => {
          if (!f.timing || !f.step_instruction) return false;
          const t = f.timing;
          const l = step.label;
          if (l === "混ぜる" && t.includes("混ぜ")) return true;
          if (l === "捏ね" && (t.includes("捏ね") || t.includes("合わせ"))) return true;
          if (l === "一次発酵" && t.includes("一次発酵")) return true;
          if (l === "成形" && (t.includes("成形") || t.includes("巻き") || t.includes("包む") || t.includes("抜く") || t.includes("のせ"))) return true;
          if ((l === "焼成" || l.includes("焼成")) && (t.includes("焼成") || t.includes("揚げる"))) return true;
          if (l === "仕上げ" && (t.includes("仕上げ") || t.includes("かけ") || t.includes("まぶす") || t.includes("冷ます"))) return true;
          return false;
        });
        if (matchingFillings.length > 0) {
          const instructions = matchingFillings.map(f => `【${f.name}】${f.step_instruction}`).join(" ");
          return { ...step, desc: `${step.desc} ${instructions}` };
        }
        return step;
      });

      const matchedFillingNames = updatedSteps.flatMap(s => s.desc.match(/【(.*?)】/g) || []).map(m => m.replace(/[【】]/g, ""));
      const missingFillings = fillingsData.filter(f => !matchedFillingNames.includes(f.name));
      if (missingFillings.length > 0) {
        const fallbackStep = updatedSteps.find(s => s.label === "成形") || updatedSteps.find(s => s.label === "捏ね") || updatedSteps[0];
        if (fallbackStep) {
          const extraInstructions = missingFillings.map(f => `【${f.name}】${f.step_instruction}`).join(" ");
          fallbackStep.desc += ` ${extraInstructions}`;
        }
      }

      const displayBaseIngredients = adjustedBaseIngredients.filter(ing => !["強力粉", "塩", "水", "ドライイースト"].includes(ing.name));

      return {
        name:            ai.name || config.breadName || "名称未設定のパン",
        catchcopy:       ai.catchcopy || "",
        feature:         config.breadDesc || config.profile?.description || "",
        recommend:       "", 
        point:           "丁寧に作りましょう。",
        fillings:        fillingsData,
        isBread,
        breadName:       config.breadName,
        texture,
        time:            timeCondition === "一晩" ? "翌日完成" : timeCondition === "30分以内" ? "約30分" : "約1時間",
        servings:        servingsMap[flourGrams] || "8個分",
        difficulty_level: difficulty,
        method,
        flourGrams,
        sweetness:       texture === "ふんわり" ? "甘め" : texture === "ハード系" ? "控えめ" : "中程度",
        ingredientsData: [...adjustedBaseIngredients, ...fillingsData],
        ingredients:     [...formatIngredients(displayBaseIngredients), ...fillingsData.map(f => `${f.name} ${f.grams}g`)],
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
    return Response.json({ error: "レシピの生成に失敗しました。" }, { status: 500 });
  }
}
