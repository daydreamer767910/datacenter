import OpenAI from "openai";

export class OpenAIClient {
  private openai: OpenAI;

  // 默认配置
  private static defaultMaxTokens = 200;
  private static defaultTemperature = 0.7;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ baseURL: process.env.BASE_URL, apiKey: apiKey });
  }

  /**
   * 获取 Chat Completion 的结果
   * @param messages - 聊天消息数组
   * @param model - 使用的模型 (默认: gpt-4)
   * @param maxTokens - 最大生成的 token 数量 (默认: 200)
   * @param temperature - 创造性参数，控制输出随机性 (默认: 0.7)
   * @returns 生成的聊天内容
   */
  async getChatCompletion(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    model: string = process.env.OPENAI_MODEL,
    maxTokens: number = OpenAIClient.defaultMaxTokens,
    temperature: number = OpenAIClient.defaultTemperature
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      // 确保返回的数据是有效的
      if (!response.choices || response.choices.length === 0) {
        throw new Error("No choices returned from OpenAI API.");
      }

      return response.choices[0].message?.content || "No response content.";
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
