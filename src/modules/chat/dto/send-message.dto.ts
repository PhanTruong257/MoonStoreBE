import type { MessageType } from '../../../common/constants';

export type SendMessageDto = {
  content: string;
  type?: MessageType;
};
