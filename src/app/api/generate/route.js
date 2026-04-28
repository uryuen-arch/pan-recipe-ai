import Groq from "groq-sdk";

const client = new Groq();

// 条件ラベルをプロンプト用に変換
function buildConditionText(conditions) {
  if (!conditions || conditions.length === 0) return "指定なし";

  const mapping = {
    "ハード系":           "食感はハード系（クラストがカリッとした食感）",
    "ふんわり":           "食感はふんわりやわらかい",
    "しっとり":           "食感はしっとりとした",
    "甘い":               "味は甘めのパン（菓子パン系）",
    "食事系":             "味は食事に合うシンプルな味（惣菜パン・食パン系）",
    "時短（〜1時間）":    "【重要】調理時間は1時間以内に収めること。発酵時間を短縮する工夫（イーストを多めにする・オーブンの発酵機能を使うなど）を盛り込むこと",
    "標準（1〜2時間）":   "調理時間は1〜2時間程度",
    "じっくり（低温発酵）": "低温長時間発酵（冷蔵庫で一晩など）を使った本格レシピ",
    "オーブン":           "調理方法はオーブンを使用",
    "ホームベーカリー":   "調理方法はホームベーカリーを使用。捏ねと一次発酵はホームベーカリーにおまかせする工程を含める",
    "トースター":         "調理方法はトースターで焼けるレシピ",
    "フライパン":         "調理方法はフライパンで焼けるレシピ（オーブン不要）",
    "超簡単":             "手間は超簡単。混ぜるだけ・こね不要など手順を極力シンプルに",
    "簡単":               "手間は簡単。初心者でも失敗しにくい工程",
    "普通":               "手間は普通レベル",
    "本格":               "手間は本格的。丁寧な工程でプロに近い仕上がりを目指す",
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
以下の材料と条件をもとに、本格的なパンレシピを3件生成してください。

【材料】${ingredients}

【条件】
- ${conditionText}

【必須ルール】
- 材料は全てg・ml等の具体的な分量を記載する
- stepsは最低10ステップ以上、各工程を丁寧に詳しく書く
- 各ステップは【工程名】本文の形式で書く（例：【捏ね】ボウルに...）
- 発酵温度・時間・焼成温度・時間を必ず具体的な数値で記載する
- 条件に「時短」が含まれる場合、合計時間が必ず1時間以内になるよう設計する
- ポイントは失敗しないコツを2〜3文で詳しく書く

以下のJSON形式のみで返してください。前後に説明文やバッククォートは絶対に不要です。
[
  {
    "name": "レシピ名",
    "texture": "食感（ハード系／ふんわり／しっとり のいずれか）",
    "time": "所要時間（例：約1時間）",
    "servings": "何個分・何斤分など",
    "ingredients": [
      "強力粉 300g",
      "水 200ml（人肌程度に温める）",
      "ドライイースト 4g",
      "砂糖 20g",
      "塩 5g",
      "バター 20g（室温に戻す）"
    ],
    "steps": [
      "【下準備】バターは室温に戻しておく。型を使う場合は薄く油を塗っておく。",
      "【捏ね①】ボウルに強力粉・砂糖・塩を入れて軽く混ぜる。",
      "【捏ね②】人肌に温めた水にイーストを溶かし、粉類に加えてまとめる。",
      "【捏ね③】台に出して10〜15分こねる。グルテン膜ができればOK。",
      "【バター投入】バターを加えさらに5分こねる。",
      "【一次発酵】丸めてラップをし、28℃で60分発酵させる。",
      "【ガス抜き】軽くガスを抜き分割して丸め直す。",
      "【ベンチタイム】濡れ布巾をかけて15分休ませる。",
      "【成形】ガスを抜きながら成形し、とじ目を下にして型に入れる。",
      "【二次発酵】35℃で30〜40分、型の8〜9分目まで膨らませる。",
      "【焼成】予熱した180℃のオーブンで25〜30分焼く。",
      "【仕上げ】すぐ型から出し、網の上で冷ます。"
    ],
    "fermentation": "一次発酵 28℃・60分 / 二次発酵 35℃・30〜40分",
    "point": "捏ねが足りないとグルテンが形成されず膨らみにくくなります。薄く伸ばして透けるほどの膜ができるまでしっかりこねましょう。発酵は温度管理が重要で、冬はオーブンの発酵機能を活用すると安定します。"
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
