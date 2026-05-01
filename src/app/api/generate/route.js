import Groq from "groq-sdk";
import { fetchProfile, calcRecipe, formatIngredients } from "../../../lib/baker";
import { getStepsTemplate } from "../../../lib/steps";

const client = new Groq();

const TEXTURE_MAP   = { "ふんわり": "ふんわり", "しっとり": "しっとり", "ハード系": "ハード系" };
const TIME_MAP      = { "30分以内": "30分以内", "1時間": "1時間", "一晩": "一晩" };
const METHOD_MAP    = { "オーブン": "オーブン", "フライパン": "フライパン", "ホームベーカリー": "ホームベーカリー", "トースター": "トースター" };
const DIFFICULTY_MAP = { "超簡単": "超簡単", "簡単": "簡単", "本格": "本格" };

export async function POST(request) {
  try {
    const { ingredients, conditions } = await request.json();

    if (!ingredients || ingredients.trim() === "") {
      return Response.json({ error: "材料を入力してください" }, { status: 400 });
    }

    const texture       = conditions.find(c => TEXTURE_MAP[c])    || "ふんわり";
    const timeCondition = conditions.find(c => TIME_MAP[c])        || "1時間";
    const method        = conditions.find(c => METHOD_MAP[c])      || "オーブン";
    const difficulty    = conditions.find(c => DIFFICULTY_MAP[c])  || "簡単";

    const userIngredients = ingredients.split(/[,、]/).map(s => s.trim()).filter(Boolean);

    // ─── DBからプロファイルを取得 ───
    const profile = await fetchProfile(texture, difficulty);

    // ─── 3パターンの粉量で配合を計算 ───
    const FLOUR_AMOUNTS = [250, 300, 350];

    const recipeConfigs = FLOUR_AMOUNTS.map(flourGrams => {
      const calc  = calcRecipe({ flourGrams, profile, timeCondition, method, userIngredients });
      const steps = getStepsTemplate(texture, method, timeCondition, calc);
      return { calc, steps, flourGrams, profile };
    });

    // ─── AIには名前・コピー・ポイントだけ生成させる ───
    const prompt = `あなたはパン作りの専門家です。
以下の条件の「${profile.type}」レシピに対して、3つの個性的なバリエーションの名前とコピーを考えてください。

条件：
- パンの種類：${profile.type}
- 食感：${texture}
- 時間：${timeCondition}
- 調理方法：${method}
- 難易度：${difficulty}
- 使用食材：${ingredients}
- 配合の特徴：${profile.description}

【具材の判定と分量】
使用食材のうち、以下は基本配合として既に計算済みです：
強力粉・薄力粉・全粒粉・水・牛乳・豆乳・バター・マーガリン・油・オリーブオイル・砂糖・塩・イースト・卵

上記以外の食材は「具材」として全3パターン共通でfillingsに追加してください。
粉量300gを基準としたベーカーズ%と分量（g）、下処理のメモを記載してください。
具材がなければ "fillings": [] としてください。

【レシピ名のルール】
- 日本語のみ（英語・カタカナ横文字は禁止）
- 具材が入っている場合は具材名をレシピ名に含める（例：リンゴとレーズンのパン）
- 「〇〇パン」「〇〇ロール」のような具体的な名前
- 造語・横文字・おしゃれすぎる名前は禁止
- シンプルで親しみやすい名前

3つそれぞれに以下を答えてください：
- name：魅力的なレシピ名
- catchcopy：一言キャッチコピー（20文字以内）
- feature：特徴を3つカンマ区切り
- recommend：他との比較で際立つ一言
- point：失敗しないコツ1〜2文
- fillings：具材リスト（全パターン共通）

JSON形式のみで返してください。バッククォートや説明文は不要です。
[
  {
    "name":"","catchcopy":"","feature":"","recommend":"","point":"",
    "fillings":[{"name":"リンゴ","grams":90,"ratio":30,"note":"皮をむいて1cm角にカット"}]
  },
  {
    "name":"","catchcopy":"","feature":"","recommend":"","point":"",
    "fillings":[{"name":"リンゴ","grams":90,"ratio":30,"note":"皮をむいて1cm角にカット"}]
  },
  {
    "name":"","catchcopy":"","feature":"","recommend":"","point":"",
    "fillings":[{"name":"リンゴ","grams":90,"ratio":30,"note":"皮をむいて1cm角にカット"}]
  }
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

    // ─── 内部ロジック + AI結果を合体 ───
    const servingsMap = { 250: "6個分", 300: "8個分", 350: "10個分" };

    const recipes = recipeConfigs.map((config, i) => {
      const ai   = aiData[i] || aiData[0];
      const { calc, steps } = config;

      // 具材をflouGramsに合わせてスケール
      const fillings = (ai.fillings || []).map(f => {
        const scaledGrams = Math.round(f.grams * config.flourGrams / 300);
        const scaledRatio = Math.round(f.ratio * config.flourGrams / 300 * 10) / 10;
        return {
          name:  f.name,
          grams: scaledGrams,
          ratio: scaledRatio,
          note:  f.note || null,
          isFilling: true,
        };
      });

      // 基本材料 + 具材を結合
      const allIngredientsData = [...calc.ingredients, ...fillings];
      const allIngredients = [
        ...formatIngredients(calc.ingredients),
        ...fillings.map(f => {
          const note = f.note ? `（${f.note}）` : "";
          return `${f.name} ${f.grams}g${note}`;
        }),
      ];

      return {
        name:            ai.name,
        catchcopy:       ai.catchcopy,
        feature:         ai.feature,
        recommend:       ai.recommend,
        point:           ai.point,
        fillings,
        texture,
        time:            timeCondition === "一晩"     ? "翌日完成（仕込み15分）" :
                         timeCondition === "30分以内" ? "約30分" : "約1時間",
        servings:        servingsMap[config.flourGrams] || "8個分",
        difficulty_level: difficulty,
        method,
        flourGrams:      config.flourGrams,
        sweetness:       texture === "ふんわり" ? "甘め" : texture === "ハード系" ? "控えめ" : "中程度",
        ingredientsData: allIngredientsData,
        ingredients:     allIngredients,
        stepsData:       steps,
        steps:           steps.map(s => `【${s.label}】${s.desc}${s.time ? `（目安：${s.time}）` : ""}`),
        fermentation:    calc.fermentation,
        fermentConfig:   calc.fermentConfig,
        bakingConfig:    calc.bakingConfig,
        yeastRatio:      calc.yeastRatio,
        profileType:     profile.type,
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
