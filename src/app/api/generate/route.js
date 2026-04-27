import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { ingredients, conditions } = await request.json();

    if (!ingredients || ingredients.trim() === "") {
      return Response.json({ error: "材料を入力してください" }, { status: 400 });
    }

    const prompt = `
あなたはパン作りの専門家です。
以下の材料と条件をもとに、パンレシピを3件生成してください。

【材料】${ingredients}
【条件】${conditions.length > 0 ? conditions.join("、") : "指定なし"}

以下のJSON形式のみで返してください。前後に説明文や\`\`\`は絶対に不要です。
[
  {
    "name": "レシピ名",
    "texture": "食感（ふわふわ／ハード／しっとり のいずれか）",
    "time": "所要時間（例：約45分）",
    "ingredients": ["材料1 分量", "材料2 分量"],
    "steps": ["手順1", "手順2", "手順3"],
    "fermentation": "一次発酵 XX分 / 二次発酵 XX分",
    "point": "ポイントを1〜2文で"
  }
]
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleaned = text.replace(/```json|```/g, "").trim();
    const recipes = JSON.parse(cleaned);

    return Response.json({ recipes });
  } catch (error) {
    console.error("Gemini API error:", error);
    return Response.json(
      { error: "レシピの生成に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
