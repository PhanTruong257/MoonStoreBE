export type AnalyticsHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export type AdminAnalyticsAskDto = {
  question: string;
  history?: AnalyticsHistoryItem[];
};

/** Mỗi lần AI gọi 1 tool → 1 phần tử {tool, result} để FE vẽ bảng/biểu đồ. */
export type AdminAnalyticsAskResponseDto = {
  text: string;
  data: { tool: string; result: unknown }[];
};
