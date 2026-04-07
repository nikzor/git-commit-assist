const BASE_URL = "https://api.proxyapi.ru/google";
const MODEL = "gemini-3.1-flash-lite-preview";

interface GenerateContentResponse {
  text?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createClient(apiKey: string): Promise<any> {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({
    apiKey,
    httpOptions: { baseUrl: BASE_URL },
  });
}

export class GeminiRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private clientPromise: Promise<any>;

  constructor(apiKey: string) {
    this.clientPromise = createClient(apiKey);
  }

  async sendMessage(prompt: string): Promise<string> {
    const client = await this.clientPromise;
    const response: GenerateContentResponse =
      await client.models.generateContent({
        model: MODEL,
        contents: prompt,
      });

    return response.text ?? "";
  }

  async testConnection(): Promise<string> {
    return this.sendMessage(
      "Hello! Respond with a single short sentence to confirm you are working.",
    );
  }
}
