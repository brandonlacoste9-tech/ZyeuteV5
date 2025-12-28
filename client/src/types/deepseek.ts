
export interface DeepSeekChoice {
  message: {
    content: string;
    role: string;
  };
  finish_reason: string;
  index: number;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: DeepSeekChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
