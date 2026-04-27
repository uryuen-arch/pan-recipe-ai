import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  const { ingredients, conditions } = await request.json();

  const prompt = `
あなたはパン作りの専門家です。
以下の材料と条件をもとに、パンレシピを3件生成してください。

【材料】${ingredients}
【条件】${conditions.join("、")}

以下のJSON形式のみで返してください。前後に説明文や\`\`\`は不要です。
[
  {
    "name": "レシピ名",
    "texture": "食感",
    "time": "所要時間（例：約45分）",
    "ingredients": ["材料1 分量", "材料2 分量"],
    "steps": ["手順1", "手順2"],
    "fermentation": "一次発酵 XX分 / 二次発酵 XX分",
    "point": "ポイント"
  }
]
`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Geminiが```jsonで囲む場合があるので除去
  const cleaned = text.replace(/```json|```/g, "").trim();
  const recipes = JSON.parse(cleaned);

  return Response.json({ recipes });
}