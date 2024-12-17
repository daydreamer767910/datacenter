import axios, { AxiosInstance } from "axios";

// 通用接口定义
export interface AIServiceConfig {
  baseUrl: string;
  timeout?: number;
  transformResponse?: (response: any) => string; // 定义响应转换方法
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class AIServiceBase {
  protected apiClient: AxiosInstance;
  private transformResponse?: (response: any) => string;

  constructor(config: AIServiceConfig, apiKey: string) {
    this.apiClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: config.timeout || 5000,
    });
    this.transformResponse = config.transformResponse;
  }

  // 通用方法: 向 API 发送请求
  async sendMessage(endpoint: string, payload: object): Promise<string> {
    try {
      const response = await this.apiClient.post(endpoint, payload);
      // 使用自定义的响应转换器处理响应
      if (this.transformResponse) {
        return this.transformResponse(response.data);
      }
      throw new Error("Transform response function is not defined.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new Error(`Timeout: ${error.message}`);
        } else {
          throw new Error(
            `Error: ${error.message}:${error.response?.status || "unknown"}-${
              error.response?.statusText
            }`
          );
        }
      } else {
        throw new Error(`Unexpected error: ${error}`);
      }
    }
  }
}

// 类工厂函数
export function createAIService(config: AIServiceConfig) {
  return class extends AIServiceBase {
    constructor(apiKey: string) {
      super(config, apiKey);
    }
  };
}
