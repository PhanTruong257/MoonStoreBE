import type { MessageDto } from './message-response.dto';

export type ConversationProductDto = {
  id: number;
  name: string;
  imageUrl: string;
} | null;

export type ConversationLastMessageDto = {
  id: number;
  content: string;
  senderId: number;
  type: string;
  createdAt: string;
} | null;

export type ConversationItemDto = {
  id: number;
  status: string;
  buyerId: number;
  sellerId: number;
  buyer: {
    id: number;
    fullName: string;
  };
  seller: {
    id: number;
    userId: number;
    shopName: string;
  };
  product: ConversationProductDto;
  orderId: number | null;
  lastMessage: ConversationLastMessageDto;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
};

export type ConversationListResponseDto = {
  conversations: ConversationItemDto[];
};

export type CreateConversationResponseDto = {
  conversation: ConversationItemDto;
};

export type ConversationDetailResponseDto = {
  conversation: ConversationItemDto;
  messages: MessageDto[];
};

export type UnreadCountResponseDto = {
  unreadCount: number;
};
