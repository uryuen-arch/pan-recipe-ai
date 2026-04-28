import Groq from "groq-sdk";

const client = new Groq();

function buildConditionText(conditions) {
  if (!conditions || conditions.length === 0) return "指定なし";

  const mapping = {
    "超簡単":         "【最重要】手間は超簡単。こね不要・混ぜるだけなど工程を極力シンプルにすること",
    "簡単":           "【最重要】手間は簡単。初心者でも失敗しにくいシンプルな工程にすること",
    "本格":           "【最重要】本格的な仕上がり。丁寧な工程でプロに近いクオリティを目指すこと",
    "30分以内":       "【重要】材料を混ぜてから焼き上がりまで30分以内に収めること。発酵なしまたは超短時間発酵のレシピにすること",
    "1時間":          "【重要】材料を混ぜてから焼き上がりまで1時間以内に収めること",
    "一晩":           "低温長時間発酵（冷蔵庫で8〜12時間）を使った本格レシピ。翌朝焼けるスケジュールで記載すること",
    "フライパン":     "調理方法はフライパンのみで焼けるレシピ。オーブン不要",
    "オーブン":       "調理方法はオーブンを使用",
    "ホームベーカリー": "調理方法はホームベーカリーを使用。捏ねと一次発酵はホームベーカリーにおまかせする工程を含めること",
    "ふんわり":       "食感はふんわりやわらかい",
    "しっとり":       "食感はしっとりとした",
    "ハード系":       "食感はハード系（クラストがカリッとした食感）",
  };

  return conditions.map((c) => mapping[c] || c).join("\n- ");
}

export async function POST(request) {
  try {
    const { ingredients, conditions } = await request.json();

    if (!ingredients || ingredients.trim() === "") {
      return Response.json({ error: "材料を入力してください" }, { status: 400 });
    }

    const conditionText = buildConditionText(conditions);

    const prompt = `あなたはパン作りの専門家です。
以下の材料と条件をもとに、パンレシピを3件生成してください。

【材料】${ingredients}

【条件】
- ${conditionText}

【必須ルール】
- 材料は全てg・ml等の具体的な分量を記載する
- stepsは最低10ステップ以上、各工程を丁寧に詳しく書く
- 各ステップは【工程名】本文の形式で書く（例：【捏ね】ボウルに...）
- 発酵温度・時間・焼成温度・時間を必ず具体的な数値で記載する
- 時間条件が指定されている場合は必ずその時間内に収めること
- ポイントは失敗しないコツを2〜3文で詳しく書く

以下のJSON形式のみで返してください。前後に説明文やバッククォートは絶対に不要です。
[
  {
    "name": "レシピ名",
    "texture": "食感（ふんわり／しっとり／ハード系 のいずれか）",
    "time": "所要時間（例：約45分）",
    "servings": "何個分・何斤分など",
    "ingredients": ["材料1 分量", "材料2 分量"],
    "steps": [
      "【下準備】内容",
      "【捏ね①】内容",
      "【捏ね②】内容",
      "【一次発酵】内容",
      "【ガス抜き】内容",
      "【ベンチタイム】内容",
      "【成形】内容",
      "【二次発酵】内容",
      "【焼成】内容",
      "【仕上げ】内容"
    ],
    "fermentation": "一次発酵 28℃・60分 / 二次発酵 35℃・30〜40分",
    "point": "失敗しないコツを2〜3文で"
  }
]`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;
    const cleaned = text.replace(/```json|```/g, "").trim();
    const recipes = JSON.parse(cleaned);

    return Response.json({ recipes });
  } catch (error) {
    console.error("Groq API error:", error);
    return Response.json(
      { error: "レシピの生成に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
