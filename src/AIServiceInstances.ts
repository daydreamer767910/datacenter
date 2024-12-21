import { createAIService } from "./AIServiceBase";

// 定义 OpenAI 服务
export const OpenAIService = createAIService({
  baseUrl: "https://api.openai.com/v1/",
  transformResponse: (json) => json.choices[0].message.content,
});

// 定义 Hugging Face 服务
/*
partial resp:
data: 
  {
    "index":205,
    "token":
    {
      "id":1724,
      "text":"......",
      "logprob":-0.11519789,
      "special":false
    },
    "generated_text":null,
    "details":null
  }
complete resp:
[
  {
    generated_text: '...',
  }
]
*/
export const HuggingFaceService = createAIService({
  baseUrl: "https://api-inference.huggingface.co/models/",
  timeout: 100000,
  transformResponse: (json, stream): [boolean, string] => {
    return stream 
        ? [json.token?.special ?? false, json.token?.text || ''] 
        : [true, json[0]?.generated_text || ''];
  }
    
});

export const GoogleBardService = createAIService({
  baseUrl: "https://api.googlebard.com/v1/",
  transformResponse: (json) => json.result.content, // 根据 Google Bard 的响应格式转换
});


// 定义ollama流式处理的服务
/*
partial resp:
{
  model:"llama3.2",
  created_at:"2024-12-21T07:44:36.554399644Z",
  message:{
    role:"assistant",
    content:"..."
  },
  done:false
}

complete resp:
{
  model: 'llama3.2',
  created_at: '2024-12-21T07:56:42.303280589Z',
  message: {
    role: 'assistant',
    content: "Hello! It's nice to meet you. Is there something I can help you with or would you like to chat?"        
  },
  done_reason: 'stop',
  done: true,
  total_duration: 15282297134,
  load_duration: 9608463408,
  prompt_eval_count: 32,
  prompt_eval_duration: 2272000000,
  eval_count: 25,
  eval_duration: 2405000000
}
*/
export const OllamaService = createAIService({
  baseUrl: "http://host.docker.internal:11434/api/",
  timeout: 100000,
  transformResponse: (json, stream): [boolean, string] => 
    [stream ? json.done ?? false : true, json.message?.content || '']
});
// 未来新增服务时，只需要在这里添加配置即可
