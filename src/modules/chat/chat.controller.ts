import { Body, Controller, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { ChatService } from './chat.service';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type {
  ConversationDetailResponseDto,
  ConversationListResponseDto,
  CreateConversationResponseDto,
  UnreadCountResponseDto,
} from './dto/conversation-response.dto';
import type { MarkReadResponseDto, SendMessageResponseDto } from './dto/message-response.dto';
import type { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  listConversations(@Req() req: Request): Promise<ConversationListResponseDto> {
    return this.chatService.listConversations(req);
  }

  @Post('conversations')
  createOrGetConversation(
    @Req() req: Request,
    @Body() payload: CreateConversationDto
  ): Promise<CreateConversationResponseDto> {
    return this.chatService.createOrGetConversation(req, payload);
  }

  @Get('conversations/:id')
  getConversation(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number
  ): Promise<ConversationDetailResponseDto> {
    return this.chatService.getConversationDetail(req, id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: SendMessageDto
  ): Promise<SendMessageResponseDto> {
    return this.chatService.sendMessage(req, id, payload);
  }

  @Post('conversations/:id/read')
  markRead(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number
  ): Promise<MarkReadResponseDto> {
    return this.chatService.markRead(req, id);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request): Promise<UnreadCountResponseDto> {
    return this.chatService.getUnreadCount(req);
  }
}
