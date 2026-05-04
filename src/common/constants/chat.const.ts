export const MESSAGE_TYPE = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  SYSTEM: 'SYSTEM',
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export const CONVERSATION_STATUS = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const;

export type ConversationStatus =
  (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];

export const CHAT_EVENT = {
  MESSAGE_NEW: 'chat:message:new',
  MESSAGE_READ: 'chat:message:read',
  CONVERSATION_UPDATED: 'chat:conversation:updated',
} as const;
