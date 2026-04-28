import Groq from "groq-sdk";

const client = new Groq();

export async function POST(request) {
  try {
    const { ingredients, conditions } = await request.json();

    if (!ingredients || ingredients.trim() === "") {
      return Response.json({ error: "材料を入力してください" }, { status: 400 });
    }

    const prompt = `あなたはパン作りの専門家です。
以下の材料と条件をもとに、本格的なパンレシピを3件生成してください。

【材料】${ingredients}
【条件】${conditions.length > 0 ? conditions.join("、") : "指定なし"}

各レシピは以下の点を必ず守ってください：
- 材料は全てgやml等の具体的な分量を記載する
- 手順は初心者でもわかるよう、工程ごとに細かく丁寧に記載する
- 捏ね・発酵・成形・焼成の各工程を詳しく説明する
- 発酵時間・温度・焼成温度・焼成時間を必ず具体的に記載する
- ポイントや失敗しないコツを詳しく記載する
- stepsは最低8〜12ステップ以上で詳しく書く

以下のJSON形式のみで返してください。前後に説明文やバッククォートは絶対に不要です。
[
  {
    "name": "レシピ名",
    "texture": "食感（ふわふわ／ハード／しっとり のいずれか）",
    "time": "所要時間（例：約2時間30分）",
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
      "【捏ね①】ボウルに強力粉・砂糖・塩を入れて軽く混ぜる。イーストは塩と離して置く。",
      "【捏ね②】人肌に温めた水を加え、カードや手でひとまとめにする。",
      "【捏ね③】台に出して10〜15分こねる。表面がなめらかになればOK。",
      "【バター投入】バターを加え、最初はベタつくがそのまま5分こねる。薄く伸ばして破れにくい膜（グルテン膜）ができればOK。",
      "【一次発酵】丸めてボウルに入れ、ラップをして28℃で60分発酵。指で押して跡がゆっくり戻ればOK。",
      "【ガス抜き・分割】軽くガスを抜き、レシピに応じて分割して丸め直す。",
      "【ベンチタイム】濡れ布巾をかけて15分休ませる。",
      "【成形】ガスを抜きながら成形する。とじ目をしっかり閉じて型や天板に並べる。",
      "【二次発酵】35℃で30〜40分。型の8〜9分目まで膨らめばOK。",
      "【焼成】予熱した180℃のオーブンで25〜30分焼く。焼き色がついたらアルミホイルをかぶせてOK。",
      "【仕上げ】焼き上がったらすぐ型から出し、側面を下にして網の上で冷ます。"
    ],
    "fermentation": "一次発酵 28℃・60分 / 二次発酵 35℃・30〜40分",
    "point": "捏ねが足りないとグルテンが形成されず膨らみにくくなります。生地を薄く伸ばして透けるほどの膜ができるまでしっかりこねましょう。発酵は温度管理が大切で、夏は常温でも、冬はオーブンの発酵機能を使うと安定します。"
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
