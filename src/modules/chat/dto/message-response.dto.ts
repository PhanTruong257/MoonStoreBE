export type MessageDto = {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  type: string;
  isDeleted: boolean;
  createdAt: string;
  isRead: boolean;
};

export type SendMessageResponseDto = {
  message: MessageDto;
};

export type MarkReadResponseDto = {
  conversationId: number;
  readCount: number;
};
