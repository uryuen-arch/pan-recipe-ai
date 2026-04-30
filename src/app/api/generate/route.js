import Groq from "groq-sdk";
import { calcRecipe, formatIngredients } from "../../../lib/baker";
import { getStepsTemplate } from "../../../lib/steps";

const client = new Groq();

// 条件マッピング
const TEXTURE_MAP = {
  "ふんわり": "ふんわり",
  "しっとり": "しっとり",
  "ハード系": "ハード系",
};

const TIME_MAP = {
  "30分以内": "30分以内",
  "1時間":    "1時間",
  "一晩":     "一晩",
};

const METHOD_MAP = {
  "オーブン":         "オーブン",
  "フライパン":       "フライパン",
  "ホームベーカリー": "ホームベーカリー",
  "トースター":       "トースター",
};

const DIFFICULTY_MAP = {
  "超簡単": "超簡単",
  "簡単":   "簡単",
  "本格":   "本格",
};

export async function POST(request) {
  try {
    const { ingredients, conditions } = await request.json();

    if (!ingredients || ingredients.trim() === "") {
      return Response.json({ error: "材料を入力してください" }, { status: 400 });
    }

    // 条件を解析
    const texture     = conditions.find(c => TEXTURE_MAP[c])    || "ふんわり";
    const timeCondition = conditions.find(c => TIME_MAP[c])     || "1時間";
    const method      = conditions.find(c => METHOD_MAP[c])     || "オーブン";
    const difficulty  = conditions.find(c => DIFFICULTY_MAP[c]) || "簡単";

    // ユーザー食材リスト
    const userIngredients = ingredients.split(/[,、]/).map(s => s.trim()).filter(Boolean);

    // ─── 内部ロジックで3パターンの配合を生成 ───
    const FLOUR_AMOUNTS = [250, 300, 350]; // 3パターンで粉量を変える

    const recipeConfigs = FLOUR_AMOUNTS.map(flourGrams => {
      const calc = calcRecipe({
        flourGrams,
        texture,
        timeCondition,
        method,
        userIngredients,
      });
      const steps = getStepsTemplate(texture, method, timeCondition, calc);
      return { calc, steps, flourGrams };
    });

    // ─── AIには名前・キャッチコピー・ポイント・特徴だけ生成させる ───
    const prompt = `あなたはパン作りの専門家です。
以下の条件のパンレシピに対して、3つの個性的なバリエーションの名前とコピーを考えてください。

条件：
- 食感：${texture}
- 時間：${timeCondition}
- 調理方法：${method}
- 難易度：${difficulty}
- 使用食材：${ingredients}

【レシピ名のルール】
- 日本語のみ（英語・カタカナ横文字は禁止）
- 「〇〇パン」「〇〇ブレッド」「〇〇ロール」のような具体的な名前にする
- 食材や食感が伝わる名前にする（例：ふわふわミルクパン・全粒粉カンパーニュ・バターロール）
- おしゃれすぎる横文字・造語は禁止（デリシャス〜・アルティメット〜などはNG）
- シンプルで親しみやすい名前にする

3つのバリエーション（小・中・大サイズ）それぞれに以下を考えてください：
- name：魅力的なレシピ名
- catchcopy：一言キャッチコピー（20文字以内）
- feature：特徴を3つカンマ区切り（例：甘め・しっとり・牛乳使用）
- recommend：他との比較で際立つ一言（例：一番簡単）
- point：失敗しないコツ1〜2文

JSON形式のみで返してください。バッククォートや説明文は不要です。
[
  {"name":"","catchcopy":"","feature":"","recommend":"","point":""},
  {"name":"","catchcopy":"","feature":"","recommend":"","point":""},
  {"name":"","catchcopy":"","feature":"","recommend":"","point":""}
]`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.8,
    });

    const text = completion.choices[0].message.content;
    const cleaned = text.replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(cleaned);

    // ─── 内部ロジック + AI結果を合体 ───
    const recipes = recipeConfigs.map((config, i) => {
      const ai = aiData[i] || aiData[0];
      const { calc, steps } = config;

      return {
        // AI生成部分
        name:            ai.name,
        catchcopy:       ai.catchcopy,
        feature:         ai.feature,
        recommend:       ai.recommend,
        point:           ai.point,
        // 内部ロジック部分
        texture,
        time:            timeCondition === "一晩" ? "翌日完成（仕込み15分）" :
                         timeCondition === "30分以内" ? "約30分" : "約1時間",
        servings:        `${config.flourGrams === 250 ? "6" : config.flourGrams === 300 ? "8" : "10"}個分`,
        difficulty_level: difficulty,
        method,
        flourGrams:      config.flourGrams,
        sweetness:       texture === "ふんわり" ? "甘め" : texture === "ハード系" ? "控えめ" : "中程度",
        // 計算済み配合
        ingredientsData: calc.ingredients,
        ingredients:     formatIngredients(calc.ingredients),
        // 工程テンプレート
        steps:           steps.map(s => `【${s.label}】${s.desc}${s.time ? `（目安：${s.time}）` : ""}`),
        stepsData:       steps,
        // 発酵・焼成
        fermentation:    calc.fermentation,
        fermentConfig:   calc.fermentConfig,
        bakingConfig:    calc.bakingConfig,
        bakingText:      calc.bakingText,
        yeastRatio:      calc.yeastRatio,
      };
    });

    return Response.json({ recipes });
  } catch (error) {
    console.error("Groq API error:", error);
    return Response.json(
      { error: "レシピの生成に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
