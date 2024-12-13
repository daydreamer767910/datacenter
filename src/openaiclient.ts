import axios from 'axios';
import * as LOG from "./logger";

const Logger = {
  log: (level: string, message: string, ...meta: any[]) =>
	LOG.GetLogger("app")?.log(level, message, ...meta),
};

export class OpenAIClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.openai.com/v1'; // OpenAI API 的基础 URL
  }

  /**
   * 调用 OpenAI Chat Completion API
   * @param messages 对话内容
   * @param model 使用的模型（如 'gpt-4' 或 'gpt-3.5-turbo'）
   * @returns AI 返回的响应
   */
  async getChatCompletion(messages: { role: string; content: string }[], model: string = 'gpt-3.5-turbo'): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model,
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data;
    } catch (error) {
		Logger.log('error','Error calling OpenAI API:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  /**
   * 调用 OpenAI Completion API
   * @param prompt 输入提示
   * @param model 使用的模型
   * @param maxTokens 最大生成令牌数
   * @returns AI 返回的响应
   */
  async getCompletion(prompt: string, model: string = 'gpt-3.5-turbo', maxTokens: number = 100): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/completions`,
        {
          model,
          prompt,
          max_tokens: maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      Logger.log('error','Error calling OpenAI API:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }
}

