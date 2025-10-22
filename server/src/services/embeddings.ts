import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await model.embedContent(text);
  return result.embedding.values;
}
