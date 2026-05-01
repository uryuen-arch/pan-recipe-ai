import Groq from "groq-sdk";
import { calcRecipe, formatIngredients } from "../../../lib/baker";
import { getStepsTemplate } from "../../../lib/steps";
import { matchRecipes, extractFillings, getSubstituteNote } from "../../lib/matcher";
import { createClient } from "@supabase/supabase-js";

const client = new Groq();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TIME_MAP      = { "30分以内": "30分以内", "1時間": "1時間", "一晩": "一晩" };
const METHOD_MAP    = { "オーブン": "オーブン", "フライパン": "フライパン", "ホームベーカリー": "ホームベーカリー", "トースター": "トースター" };
const DIFFICULTY_MAP = { "超簡単": "超簡単", "簡単": "簡単", "本格": "本格" };

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

    // ─── DBから全プロファイルを取得 ───
    const { data: profiles, error } = await supabase
      .from("bread_profiles")
      .select("*")
      .eq("is_active", true)
      .eq("difficulty", difficulty);

    if (error) throw error;

    // ─── マッチング実行 ───
    const matched = matchRecipes(userIngredients, profiles);

    // 上位3件を選択（perfectとalmost優先）
    const top3 = matched.slice(0, 3);

    // 具材を抽出
    const fillings = extractFillings(userIngredients);

    // ─── 各プロファイルで配合と工程を計算 ───
    const FLOUR_AMOUNTS = [250, 300, 350];

    const recipeConfigs = top3.map((match, i) => {
      const flourGrams = FLOUR_AMOUNTS[i] || 300;
      const texture    = match.profile.texture;
      const calc  = calcRecipe({ flourGrams, profile: match.profile, timeCondition, method, userIngredients });
      const steps = getStepsTemplate(texture, method, timeCondition, calc);
      return { match, calc, steps, flourGrams, texture };
    });

    // ─── AIには名前・コピー・ポイント・具材分量だけ生成 ───
    const profileSummary = top3.map((m, i) => (
      `${i + 1}. ${m.profile.type}（${m.profile.texture}・${m.category === "perfect" ? "今すぐ作れる" : `${m.missing.join("・")}が必要`}）`
    )).join("\n");

    const fillingsPrompt = fillings.length > 0
      ? `\n【具材の分量指示】\n以下の具材の分量をベーカーズ%(粉量300g基準)で決めてください：${fillings.join("・")}\nfillingsに追加してください。`
      : "";

    const prompt = `あなたはパン作りの専門家です。
以下の3種類のパンに対して、それぞれ名前とコピーを考えてください。

マッチしたパン：
${profileSummary}

条件：
- 時間：${timeCondition}
- 調理方法：${method}
- 難易度：${difficulty}
- 使用食材：${ingredients}
${fillingsPrompt}

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
- fillings：具材リスト（なければ[]）

JSON形式のみ。バッククォートや説明文は不要です。
[
  {"name":"","catchcopy":"","feature":"","recommend":"","point":"","fillings":[]},
  {"name":"","catchcopy":"","feature":"","recommend":"","point":"","fillings":[]},
  {"name":"","catchcopy":"","feature":"","recommend":"","point":"","fillings":[]}
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
      const ai      = aiData[i] || aiData[0];
      const { match, calc, steps, flourGrams, texture } = config;

      // 具材スケール
      const fillingsData = (ai.fillings || []).map(f => ({
        name:      f.name,
        grams:     Math.round((f.grams || 0) * flourGrams / 300),
        ratio:     Math.round((f.ratio || 0) * flourGrams / 300 * 10) / 10,
        note:      f.note || null,
        isFilling: true,
      }));

      const allIngredientsData = [...calc.ingredients, ...fillingsData];
      const allIngredients = [
        ...formatIngredients(calc.ingredients),
        ...fillingsData.map(f => `${f.name} ${f.grams}g${f.note ? `（${f.note}）` : ""}`),
      ];

      return {
        // AI生成
        name:            ai.name,
        catchcopy:       ai.catchcopy,
        feature:         ai.feature,
        recommend:       ai.recommend,
        point:           ai.point,
        fillings:        fillingsData,
        // マッチング情報
        category:        match.category,
        missing:         match.missing,
        substituted:     match.substituted,
        substituteNote:  getSubstituteNote(match.substituted),
        // 内部ロジック
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
        profileType:     match.profile.type,
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
