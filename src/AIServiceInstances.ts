import { createAIService } from "./AIServiceBase";

// 定义 OpenAI 服务
export const OpenAIService = createAIService({
  baseUrl: "https://api.openai.com/v1/",
  transformResponse: (response) => response.choices[0].message.content,
});

// 定义 Hugging Face 服务
export const HuggingFaceService = createAIService({
  baseUrl: "https://api-inference.huggingface.co/models/",
  timeout: 100000,
  transformResponse: (response) => response[0].generated_text || "",
});

export const GoogleBardService = createAIService({
  baseUrl: "https://api.googlebard.com/v1/",
  transformResponse: (response) => response.result.content, // 根据 Google Bard 的响应格式转换
});


const handleStreamResponse = async (stream: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    let content = "";

    stream.on("data", (chunk: Buffer) => {
      try {
        const rawJson = chunk.toString();
        const json = JSON.parse(rawJson);

        if (json.done === false && json.message?.content) {
          //console.log(json.message.content); // 实时输出
          content += json.message.content; // 累加内容
        }
      } catch (err) {
        console.error("Error parsing stream chunk:", err);
      }
    });

    stream.on("end", () => resolve(content));
    stream.on("error", (err: Error) => reject(`Stream error: ${err.message}`));
  });
};

// 定义ollama流式处理的服务
export const OllamaService = createAIService({
  baseUrl: "http://host.docker.internal:11434/api/",
  timeout: 100000,
  transformResponse: handleStreamResponse, // 使用通用流式逻辑
});
// 未来新增服务时，只需要在这里添加配置即可
