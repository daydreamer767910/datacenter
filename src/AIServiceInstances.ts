import { createAIService } from './AIServiceBase';

// 定义 OpenAI 服务
export const OpenAIService = createAIService({
  baseUrl: 'https://api.openai.com/v1/',
  transformResponse: (response) => response.choices[0].message.content,
});

// 定义 Hugging Face 服务
export const HuggingFaceService = createAIService({
  baseUrl: 'https://api-inference.huggingface.co/models/',
  timeout: 10000,
  transformResponse: (response) => response.generated_text || '',
});

export const GoogleBardService = createAIService({
  baseUrl: 'https://api.googlebard.com/v1/',
  transformResponse: (response) => response.result.content, // 根据 Google Bard 的响应格式转换
});
// 未来新增服务时，只需要在这里添加配置即可
