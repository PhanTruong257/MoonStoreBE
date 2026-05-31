export type AiChatMessageRole = 'user' | 'assistant';

export type AiChatHistoryItem = {
  role: AiChatMessageRole;
  content: string;
};

export class AiChatRequestDto {
  message: string;
  history?: AiChatHistoryItem[];
}
