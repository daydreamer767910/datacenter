import axios, { AxiosInstance } from "axios";

// 通用接口定义
export interface AIServiceConfig {
  baseUrl: string;
  timeout?: number;
  transformResponse?: (json: any, isStream: boolean) => [boolean, string];
}

export class AIServiceBase {
  protected apiClient: AxiosInstance;
  private sendCallback?: (content: string) => void;
  private transformResponse?: AIServiceConfig["transformResponse"];

  constructor(
    config: AIServiceConfig,
    apiKey: string,
    callback?: (content: string) => Promise<void>
  ) {
    this.apiClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: config.timeout || 5000,
    });
    this.transformResponse = config.transformResponse;
    this.sendCallback = callback;
  }

  private async handleResponse(
    stream: any,
    isStream: boolean,
    separator: string
  ): Promise<string> {
    if (!this.transformResponse) {
      throw new Error("Transform response function is not defined.");
    }
    if (!isStream) {
      //console.log(stream)
      let [, content] = this.transformResponse(stream, false);
      if (this.sendCallback && content !== "") {
        this.sendCallback(content); // 触发回调
        content = ""; // 清空内容（或根据需要保持部分内容）
      }
      return Promise.resolve(content);
    }
    return new Promise((resolve, reject) => {
      let buffer = ""; // 用于暂存未完成的 JSON 数据
      let accumulatedContent = "";
      stream.on("data", async (chunk: Buffer) => {
        try {
          // 将当前数据块添加到缓冲区
          buffer += chunk.toString();
          //console.log(chunk.toString());
          // 按分隔符切割缓冲区内容，生成 JSON 片段
          const parts = buffer.split(separator);

          // 保留最后一个不完整的部分，其他部分尝试解析
          buffer = parts.pop() || "";

          for (let part of parts) {
            try {
              // 去掉分隔符可能残留的前缀空格或换行符
              part = part.trim();

              if (!part || part === "[DONE]") continue; //空
              if (!part.startsWith("{") || !part.endsWith("}")) {
                console.warn("Skipping non-JSON chunk:", part);
                continue;
              }
              const json = JSON.parse(part);
              if (this.transformResponse) {
                const [done, content] = this.transformResponse(json, true);
                if (content) {
                  accumulatedContent += content;
                }
                // 如果 accumulatedContent 达到 100，则回调上层钩子
                if (
                  this.sendCallback &&
                  (done || accumulatedContent.length >= 1024*2)
                ) {
                  this.sendCallback(accumulatedContent); // 触发回调
                  accumulatedContent = ""; // 清空内容（或根据需要保持部分内容）
                }
              }
            } catch (err) {
              console.error("Error parsing JSON chunk:", err);
            }
          }
        } catch (err) {
          console.error("Error processing stream chunk:", err);
        }
      });

      stream.on("end", async () => {
        try {
          if (buffer) {
            buffer = buffer.trim(); // 先去掉前后空格
            if (buffer.startsWith("{") && buffer.endsWith("}")) {
              const json = JSON.parse(buffer);
              if (this.transformResponse) {
                const [, content] = this.transformResponse(json, true);
                if (content) accumulatedContent += content;
              }
            } else {
              console.warn("Final buffer is not a valid JSON object:", buffer);
            }
          }
        } catch (err) {
          console.error("Error parsing final JSON chunk:", err);
        } finally {
          //console.log('---end:',accumulatedContent)
          if (this.sendCallback && accumulatedContent !== "") {
            this.sendCallback(accumulatedContent); // 触发回调
            accumulatedContent = ""; // 清空内容（或根据需要保持部分内容）
          }
          resolve(accumulatedContent);
        }
      });

      stream.on("error", (err: Error) =>
        reject(`Stream error: ${err.message}`)
      );
    });
  }

  // 通用方法: 向 API 发送请求
  async sendMessage(
    endpoint: string,
    payload: object,
    isStream = false,
    separator = "\n"
  ): Promise<string> {
    try {
      //console.log(`sendMsg to ${endpoint}\r\npayload:${JSON.stringify(payload,null,2)}`)
      const response = await this.apiClient.post(endpoint, payload, {
        responseType: isStream ? "stream" : "json",
      });

      return await this.handleResponse(response.data, isStream, separator);
      //return response.data;
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
    constructor(apiKey: string, callback?: (content: string) => Promise<void>) {
      super(config, apiKey, callback);
    }
  };
}
