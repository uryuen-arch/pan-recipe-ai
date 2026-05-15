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

const FALLBACK_PROFILES = [
  { id: 'f1', type: '菓子パン', dough_type: 'rich', texture: 'ふんわり', difficulty: '簡単', water: 0, milk: 65, sugar: 10, salt: 2, yeast: 1.5, butter: 10, egg: 15, is_active: true, description: 'リッチな味わいの基本生地' },
  { id: 'f2', type: 'シンプルパン', dough_type: 'simple', texture: 'ふんわり', difficulty: '超簡単', water: 65, milk: 0, sugar: 5, salt: 2, yeast: 1.5, butter: 0, egg: 0, is_active: true, description: '万能なシンプル生地' },
  { id: 'f3', type: 'フランスパン', dough_type: 'lean', texture: 'ハード系', difficulty: '本格', water: 65, milk: 0, sugar: 0, salt: 2, yeast: 0.8, butter: 0, egg: 0, is_active: true, description: '小麦の香りが楽しめるハードパン' }
];

export async function POST(request) {
  try {
    console.log("--- Generating Recipe START ---");
    const body = await request.json().catch(() => ({}));
    const { ingredients, conditions = [], excludeNames = [] } = body;

    if (!ingredients || typeof ingredients !== "string" || ingredients.trim().length < 2) {
      return Response.json({ error: "材料を入力してください" }, { status: 400 });
    }

    const timeCondition = conditions.find(c => TIME_MAP[c])       || "1時間";
    const method        = conditions.find(c => METHOD_MAP[c])     || "オーブン";
    const difficulty    = conditions.find(c => DIFFICULTY_MAP[c]) || "簡単";
    const prefTexture   = conditions.find(c => ["ふんわり", "ハード系", "もちもち", "しっとり"].includes(c));

    const userIngredients = ingredients.split(/[,、\n]/).map(s => s.trim()).filter(Boolean);

    // 1. 各種マスタデータの取得
    const [profilesRes, componentsRes, breadsRes, variationsRes] = await Promise.all([
      supabase.from("bread_profiles").select("*"),
      supabase.from("components").select("*"),
      supabase.from("breads").select("*"),
      supabase.from("variations").select("*")
    ]);

    let profiles = (profilesRes.data && profilesRes.data.length > 0) ? profilesRes.data : FALLBACK_PROFILES;
    let components = componentsRes.data || [];
    let breads = breadsRes.data || [];
    let variations = variationsRes.data || [];
    console.log(`DB Fetched: profiles=${profiles.length}, components=${components.length}, breads=${breads.length}, variations=${variations.length}`);

    // 2. マッチングエンジンの実行
    const matchedProfiles = matchRecipes(userIngredients, profiles);
    const matchedComponents = matchComponents(userIngredients, components);
    const matchedBreadsList = matchBreads(matchedProfiles, matchedComponents, breads, userIngredients);
    const matchedVariations = matchVariations(userIngredients, variations, matchedProfiles);
    console.log(`Engine Matched: breads=${matchedBreadsList.length}, profiles=${matchedProfiles.length}, variations=${matchedVariations.length}`);

    // 3. 提案候補の選択（カテゴリ優先・フラットに統合）
    // すべての候補を統合（lackingは除外）
    const allCandidates = [
      ...matchedBreadsList.filter(b => b.category !== 'lacking').map(b => ({ ...b, type: "bread", sortPriority: 1 })),
      ...matchedVariations.filter(v => v.category !== 'lacking').map(v => ({ ...v, type: "variation", sortPriority: 2 })),
      ...matchedProfiles.filter(p => p.category !== 'lacking').map(p => ({ ...p, type: "base", sortPriority: 3 }))
    ];

    // ユーザー指定の食感に合致するかどうかでボーナス
    allCandidates.forEach(c => {
      const itemTexture = c.type === "bread" ? c.bread.texture : (c.type === "variation" ? c.baseProfile?.texture : c.profile?.texture);
      if (prefTexture && itemTexture === prefTexture) {
        c.score = (c.score || 0) + 30; // 非常に大きなボーナス
      }
    });

    // カテゴリ（perfect > almost）を最優先にし、その中でスコア（食感ボーナス含む）でソート
    allCandidates.sort((a, b) => {
      const catOrder = { perfect: 0, almost: 1, lacking: 2 };
      if (catOrder[a.category] !== catOrder[b.category]) return catOrder[a.category] - catOrder[b.category];
      
      // スコア（食感・具材ボーナス）でソート
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      
      // それでも同じなら型優先度
      return a.sortPriority - b.sortPriority;
    });

    // 重複を排除しつつ上位3つを選択
    const finalSelection = [];
    const seenDoughTypes = new Set();
    const seenNames = new Set(excludeNames);

    for (const item of allCandidates) {
      if (finalSelection.length >= 3) break;
      const name = item.type === "bread" ? item.bread.name : (item.type === "variation" ? item.variation.variation_name : item.profile.type);
      const doughType = item.type === "bread" ? item.bread.dough_type : (item.type === "variation" ? item.variation.base_dough_type : item.profile.dough_type);
      
      // 同じ名前や同じ生地タイプの重複を避ける（バリエーション豊かにするため）
      if (seenNames.has(name)) continue;
      // perfectが複数ある場合は、生地タイプが被っても出す（作りやすさ優先）
      // ただし全く同じものは避ける
      if (item.category !== 'perfect' && seenDoughTypes.has(doughType)) continue;

      finalSelection.push(item);
      seenNames.add(name);
      seenDoughTypes.add(doughType);
    }

    // 候補が足りない場合に備えて、除外していたものを再度検討する（フォールバック）
    if (finalSelection.length < 3 && excludeNames.length > 0) {
      for (const item of allCandidates) {
        if (finalSelection.length >= 3) break;
        const name = item.type === "bread" ? item.bread.name : (item.type === "variation" ? item.variation.variation_name : item.profile.type);
        if (finalSelection.some(s => {
          const sName = s.type === "bread" ? s.bread.name : (s.type === "variation" ? s.variation.variation_name : s.profile.type);
          return sName === name;
        })) continue;
        finalSelection.push(item);
      }
    }

    // 選択されたものが入力具材（例：バナナ）を一つも使っていない場合、
    // もし候補の中に具材を使うものがあれば、入れ替えを検討する（多様性と納得感のため）
    const userFillings = extractFillings(userIngredients);
    if (userFillings.length > 0 && !finalSelection.some(s => {
      const text = (s.bread?.name || s.variation?.variation_name || s.profile?.type || "") + (s.bread?.description || s.variation?.description || "");
      return userFillings.some(f => text.includes(f));
    })) {
      const bestFillingCandidate = allCandidates.find(c => {
        const text = (c.bread?.name || c.variation?.variation_name || c.profile?.type || "") + (c.bread?.description || c.variation?.description || "");
        return userFillings.some(f => text.includes(f)) && !seenNames.has(c.bread?.name || c.variation?.variation_name || c.profile?.type);
      });
      if (bestFillingCandidate && finalSelection.length > 0) {
        finalSelection[finalSelection.length - 1] = bestFillingCandidate;
      }
    }

    if (finalSelection.length < 3) {
      FALLBACK_PROFILES.forEach(p => {
        if (finalSelection.length < 3 && !finalSelection.some(f => (f.profile?.id === p.id || f.doughProfile?.id === p.id))) {
          finalSelection.push({ profile: p, type: "base", category: 'almost', missing: [] });
        }
      });
    }
    console.log(`Final Selection Count: ${finalSelection.length}`);

    // 4. レシピ構成の組み立て
    const FLOUR_AMOUNTS = [250, 300, 350];
    const recipeConfigs = finalSelection.map((item, i) => {
      const flourGrams = FLOUR_AMOUNTS[i] || 300;
      const isBread = item.type === "bread";
      const isVariation = item.type === "variation";
      const profile = isBread ? item.doughProfile : (isVariation ? item.baseProfile : item.profile);
      
      const breadName = isBread ? item.bread.name : (isVariation ? item.variation.variation_name : (profile?.type || "基本のパン"));
      let texture = profile?.texture || "ふんわり";
      
      // 菓子パン類の食感補正（ハード系に誤分類されるのを防ぐ）
      const sweetBuns = ["あんぱん", "アンパン", "クリームパン", "ジャムパン", "メロンパン", "チョココロネ", "チョコクリームパン", "パン・オ・ショコラ"];
      if (sweetBuns.some(b => breadName.includes(b))) {
        texture = "ふんわり";
      }

      const stepsType = isBread ? item.bread.steps_type : (isVariation ? item.variation.steps_type : profile?.steps_type) || "standard";

      const calc = calcRecipe({ 
        flourGrams, 
        profile: { ...profile, steps_type: stepsType, texture }, // textureを上書き
        timeCondition, 
        method, 
        userIngredients,
        breadName
      });
      let baseSteps = getStepsTemplate(texture, method, timeCondition, { ...calc, profile: { ...profile, steps_type: stepsType, texture } });

      if (isBread && item.components && item.components.length > 0) {
        const componentInstructions = item.components.flatMap(c => (c.recipe_steps || []).map(step => `【${c.name}作り】${step}`));
        const prepStep = baseSteps.find(s => s.label === "下準備");
        if (prepStep) prepStep.desc += " " + componentInstructions.join(" ");
      } else if (isVariation && item.variation.steps_note) {
        const prepStep = baseSteps.find(s => s.label === "下準備" || s.label === "成形");
        if (prepStep) prepStep.desc += " " + item.variation.steps_note;
      }

      return {
        item, isBread, isVariation, profile, calc, steps: baseSteps, flourGrams, texture,
        category: item.category || 'almost', missing: item.missing || [],
        breadName: isBread ? item.bread.name : (isVariation ? item.variation.variation_name : null),
        breadDesc: isBread ? item.bread.description : (isVariation ? item.variation.description : null),
      };
    });

    const profileSummary = recipeConfigs.map((config, i) => {
      const name = config.breadName || (config.profile?.type || "基本のパン");
      const status = config.category === "perfect" ? "今すぐ作れる" : `${(config.missing || []).join("・")}が必要`;
      const note = config.isVariation && config.item.variation.steps_note ? `（注記：${config.item.variation.steps_note}）` : "";
      return `${i + 1}. ${name}（${config.texture}・${status}）${note}`;
    }).join("\n");

    console.log("AI Summary Input:\n", profileSummary);

    // 5. AI呼び出し
    const prompt = `あなたはパン専門家です。3つのパンを提案してください。
入力材料：${ingredients}
条件：${timeCondition}, ${method}, ${difficulty}
対象パン：\n${profileSummary}

制約事項：
- 対象パンのリストにあるパンの名称と特徴、および（注記）にある工程指示を必ずレシピに反映してください。
- リストにない「ドライフルーツ」や「チョコ」などの主要な具材を勝手に追加しないでください。
- 入力材料にある具材（例：バナナ、にんにく）を最大限活用してください。
- 「あんこ」や「クリーム」などのペースト状の具材は、必ず「成形」時に「生地で包む」ように指定してください（タイミング：成形時に包む）。

JSON出力例：
{
  "recipes": [
    {"name":"","catchcopy":"","fillings":[{"name":"あんこ","ratio":50,"timing":"成形時に包む","inst":"生地で包む"}]},
    {"name":"","catchcopy":"","fillings":[]},
    {"name":"","catchcopy":"","fillings":[]}
  ]
}`;

    console.log("Calling Groq API...");
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0].message.content;
    console.log("Groq Success. Parsing JSON...");
    
    let aiData;
    try {
      aiData = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("AI JSON Parse Error. Content:", rawContent);
      return Response.json({ error: "AIの回答を解析できませんでした。再度お試しください。" }, { status: 500 });
    }

    if (!aiData.recipes || !Array.isArray(aiData.recipes)) {
      console.error("AI response invalid format:", aiData);
      return Response.json({ error: "AIの回答が正しくありません。" }, { status: 500 });
    }

    // 6. レシピデータの最終構築
    const recipes = recipeConfigs.map((config, i) => {
      const ai = aiData.recipes[i] || aiData.recipes[0] || {};
      const { calc, steps, flourGrams, texture, isBread } = config;

      const BASE_MATERIAL_NAMES = ["強力粉", "薄力粉", "全粒粉", "塩", "水", "ドライイースト", "牛乳", "ミルク", "卵", "無塩バター", "有塩バター", "バター", "マーガリン", "オリーブオイル", "砂糖", "モルト", "モルトパウダー", "モルトシロップ", "モルトエキス"];
      const rawFillings = (ai.fillings || []).filter(f => {
        if (!f || !f.name) return false;
        return !BASE_MATERIAL_NAMES.some(base => f.name.includes(base) && !String(f.inst || "").includes("仕上げ"));
      });

      let liquidReduction = 0;
      let sugarReduction = 0;

      const fillingsData = rawFillings.map(f => {
        const grams = Math.round(flourGrams * (f.ratio || 0) / 100);
        let name = f.name || "具材";
        let timing = f.timing || "";
        let inst = f.inst || "";

        // あんこ・クリーム等のペースト具材の安全処理（捏ね工程で練り込まないように修正）
        if (name.includes("あん") || name.includes("餡") || name.includes("クリーム") || name.includes("ジャム")) {
          if (timing === "捏ね" || inst.includes("練り込む") || timing === "成形") {
            timing = "成形時に包む";
            inst = "生地で包む";
          }
        }

        if (timing === "捏ね" || inst.includes("練り込む")) {
          const adj = PASTE_ADJUSTMENTS[name] || Object.entries(PASTE_ADJUSTMENTS).find(([k]) => name.includes(k))?.[1];
          if (adj) {
            liquidReduction += (f.ratio || 0) * adj.liquidFactor;
            sugarReduction += (f.ratio || 0) * adj.sugarFactor;
          }
        }
        return { name, grams, ratio: f.ratio || 0, timing: timing || null, step_instruction: inst || null, isFilling: true };
      });

      const adjustedBaseIngredients = calc.ingredients.map(ing => {
        let newGrams = (ing.name === "牛乳" || ing.name === "水") ? Math.max(0, ing.grams - Math.round(flourGrams * liquidReduction / 100)) :
                       ing.name === "砂糖" ? Math.max(0, ing.grams - Math.round(flourGrams * sugarReduction / 100)) : ing.grams;
        return { ...ing, grams: newGrams };
      });

      const updatedSteps = steps.map(step => {
        const matchingFillings = fillingsData.filter(f => {
          if (!f.timing || !f.step_instruction) return false;
          const t = String(f.timing), l = step.label;
          if (l === "混ぜる" && t.includes("混ぜ")) return true;
          if (l === "捏ね" && (t.includes("捏ね") || t.includes("合わせ"))) return true;
          if (l === "成形" && (t.includes("成形") || t.includes("巻き") || t.includes("包む") || t.includes("のせ"))) return true;
          if (l.includes("焼成") && (t.includes("焼成") || t.includes("揚げる"))) return true;
          if (l === "仕上げ" && (t.includes("仕上げ") || t.includes("かけ") || t.includes("まぶす"))) return true;
          // UI component expected timing strings
          if (t === "成形時に包む" && l === "成形") return true;
          if (t === "成形時にのせる" && l === "成形") return true;
          if (t === "焼成前にかける" && l.includes("焼成")) return true;
          return false;
        });

        let desc = step.desc;
        if (matchingFillings.length > 0) {
          const instructions = matchingFillings.map(f => `【${f.name}】${f.step_instruction}`).join(" ");
          desc += " " + instructions;
        }

        // バリエーション固有の工程（steps_note）を最終ステップにも強制反映
        if (config.isVariation && config.item.variation.steps_note) {
          const note = config.item.variation.steps_note;
          if ((step.label.includes("成形") || step.label.includes("トッピング")) && !desc.includes(note)) {
            desc += ` （${note}）`;
          }
        }

        return { ...step, desc };
      });

      return {
        name: ai.name || config.breadName || "カスタムパン",
        catchcopy: ai.catchcopy || "",
        feature: config.breadDesc || config.profile?.description || "",
        category: config.category,
        missing: config.missing,
        ingredients: [...formatIngredients(adjustedBaseIngredients.filter(ing => !["強力粉","塩","水","ドライイースト"].includes(ing.name))), ...fillingsData.map(f => `${f.name} ${f.grams}g`)],
        steps: updatedSteps.map(s => `【${s.label}】${s.desc}${s.time ? `（目安：${s.time}）` : ""}`),
        ingredientsData: [...adjustedBaseIngredients, ...fillingsData],
        stepsData: updatedSteps,
        time: config.time || "約1時間",
        servings: "8個分",
        difficulty_level: difficulty,
        method,
        texture,
        flourGrams
      };
    });

    console.log("--- Generating Recipe END (Success) ---");
    return Response.json({ recipes });
  } catch (error) {
    console.error("Critical API error:", error);
    return Response.json({ error: `エラーが発生しました: ${error.message}` }, { status: 500 });
  }
}
