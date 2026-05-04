import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { getUserIdFromRequest as extractUserId } from '../../common/auth/request-user.helper';
import {
  CHAT_EVENT,
  CONVERSATION_STATUS,
  MESSAGE_TYPE,
} from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type {
  ConversationDetailResponseDto,
  ConversationItemDto,
  ConversationListResponseDto,
  CreateConversationResponseDto,
  UnreadCountResponseDto,
} from './dto/conversation-response.dto';
import type {
  MarkReadResponseDto,
  MessageDto,
  SendMessageResponseDto,
} from './dto/message-response.dto';
import type { SendMessageDto } from './dto/send-message.dto';

const MESSAGE_PAGE_SIZE = 100;
const MAX_MESSAGE_LENGTH = 2000;

type ConversationWithRelations = {
  id: number;
  status: string;
  buyerId: number;
  sellerId: number;
  productId: number | null;
  orderId: number | null;
  createdAt: Date;
  updatedAt: Date;
  buyer: { id: number; fullName: string };
  seller: { id: number; userId: number; shopName: string };
  product: { id: number; name: string; imageUrl: string } | null;
  messages: Array<{
    id: number;
    content: string;
    senderId: number;
    type: string;
    createdAt: Date;
  }>;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly gateway: ChatGateway
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserId(req, this.jwtService);
  }

  async createOrGetConversation(
    req: Request,
    payload: CreateConversationDto
  ): Promise<CreateConversationResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    if (!Number.isFinite(payload.sellerId) || payload.sellerId <= 0) {
      throw new BadRequestException('Invalid sellerId.');
    }

    const seller = await this.prisma.seller.findUnique({
      where: { id: payload.sellerId },
      select: { id: true, userId: true, shopName: true },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found.');
    }
    if (seller.userId === userId) {
      throw new BadRequestException('You cannot start a chat with yourself.');
    }

    const productId = payload.productId ?? null;
    const orderId = payload.orderId ?? null;

    const existing = await this.prisma.conversation.findFirst({
      where: {
        buyerId: userId,
        sellerId: seller.id,
        productId,
        orderId,
      },
      select: { id: true },
    });

    let conversationId: number;
    if (existing) {
      conversationId = existing.id;
    } else {
      const created = await this.prisma.conversation.create({
        data: {
          buyerId: userId,
          sellerId: seller.id,
          productId,
          orderId,
          status: CONVERSATION_STATUS.ACTIVE,
        },
        select: { id: true },
      });
      conversationId = created.id;
    }

    const full = await this.loadConversationWithRelations(conversationId);
    const unreadByConversation = await this.computeUnreadCounts(userId, [
      conversationId,
    ]);

    return {
      conversation: this.mapConversationItem(
        full,
        unreadByConversation.get(conversationId) ?? 0
      ),
    };
  }

  async listConversations(req: Request): Promise<ConversationListResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { seller: { userId } }],
      },
      include: {
        buyer: { select: { id: true, fullName: true } },
        seller: { select: { id: true, userId: true, shopName: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
        messages: {
          orderBy: { id: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            type: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const conversationIds = conversations.map((c) => c.id);
    const unreadByConversation = await this.computeUnreadCounts(
      userId,
      conversationIds
    );

    return {
      conversations: conversations.map((conversation) =>
        this.mapConversationItem(
          conversation,
          unreadByConversation.get(conversation.id) ?? 0
        )
      ),
    };
  }

  async getConversationDetail(
    req: Request,
    conversationId: number
  ): Promise<ConversationDetailResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    await this.assertParticipant(userId, conversationId);

    const conversation = await this.loadConversationWithRelations(conversationId);
    const unreadByConversation = await this.computeUnreadCounts(userId, [
      conversationId,
    ]);

    const messages = await this.prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      orderBy: { id: 'asc' },
      take: MESSAGE_PAGE_SIZE,
      include: {
        sender: { select: { id: true, fullName: true } },
        reads: {
          select: { userId: true },
        },
      },
    });

    return {
      conversation: this.mapConversationItem(
        conversation,
        unreadByConversation.get(conversationId) ?? 0
      ),
      messages: messages.map((message) =>
        this.mapMessage(
          {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderName: message.sender.fullName,
            content: message.content,
            type: message.type,
            isDeleted: message.isDeleted,
            createdAt: message.createdAt,
          },
          message.reads.some((read) => read.userId !== message.senderId)
        )
      ),
    };
  }

  async sendMessage(
    req: Request,
    conversationId: number,
    payload: SendMessageDto
  ): Promise<SendMessageResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const conversation = await this.assertParticipant(userId, conversationId);

    const trimmed = payload.content?.trim() ?? '';
    if (trimmed.length === 0) {
      throw new BadRequestException('Message content is required.');
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`
      );
    }

    const type = payload.type ?? MESSAGE_TYPE.TEXT;

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: trimmed,
          type,
        },
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      });

      await tx.messageRead.create({
        data: { messageId: created.id, userId },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    const dto = this.mapMessage(
      {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.sender.fullName,
        content: message.content,
        type: message.type,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt,
      },
      false
    );

    this.gateway.emitToUsers(
      [conversation.buyerId, conversation.seller.userId],
      CHAT_EVENT.MESSAGE_NEW,
      { conversationId, message: dto }
    );

    return { message: dto };
  }

  async markRead(
    req: Request,
    conversationId: number
  ): Promise<MarkReadResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const conversation = await this.assertParticipant(userId, conversationId);

    const unreadMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isDeleted: false,
        reads: { none: { userId } },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) {
      return { conversationId, readCount: 0 };
    }

    await this.prisma.messageRead.createMany({
      data: unreadMessages.map((message) => ({
        messageId: message.id,
        userId,
      })),
      skipDuplicates: true,
    });

    this.gateway.emitToUsers(
      [conversation.buyerId, conversation.seller.userId],
      CHAT_EVENT.MESSAGE_READ,
      {
        conversationId,
        readerUserId: userId,
        messageIds: unreadMessages.map((message) => message.id),
      }
    );

    return { conversationId, readCount: unreadMessages.length };
  }

  async getUnreadCount(req: Request): Promise<UnreadCountResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const unreadCount = await this.prisma.message.count({
      where: {
        senderId: { not: userId },
        isDeleted: false,
        conversation: {
          OR: [{ buyerId: userId }, { seller: { userId } }],
        },
        reads: { none: { userId } },
      },
    });

    return { unreadCount };
  }

  private async assertParticipant(userId: number, conversationId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        seller: { select: { userId: true } },
      },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }
    if (
      conversation.buyerId !== userId &&
      conversation.seller.userId !== userId
    ) {
      throw new ForbiddenException('Not your conversation.');
    }
    return conversation;
  }

  private async loadConversationWithRelations(
    conversationId: number
  ): Promise<ConversationWithRelations> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        buyer: { select: { id: true, fullName: true } },
        seller: { select: { id: true, userId: true, shopName: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
        messages: {
          orderBy: { id: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }
    return conversation;
  }

  private async computeUnreadCounts(
    userId: number,
    conversationIds: number[]
  ): Promise<Map<number, number>> {
    if (conversationIds.length === 0) {
      return new Map();
    }
    const grouped = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isDeleted: false,
        reads: { none: { userId } },
      },
      _count: { _all: true },
    });
    const map = new Map<number, number>();
    for (const row of grouped) {
      map.set(row.conversationId, row._count._all);
    }
    return map;
  }

  private mapConversationItem(
    conversation: ConversationWithRelations,
    unreadCount: number
  ): ConversationItemDto {
    const lastMessage = conversation.messages[0];
    return {
      id: conversation.id,
      status: conversation.status,
      buyerId: conversation.buyerId,
      sellerId: conversation.sellerId,
      buyer: {
        id: conversation.buyer.id,
        fullName: conversation.buyer.fullName,
      },
      seller: {
        id: conversation.seller.id,
        userId: conversation.seller.userId,
        shopName: conversation.seller.shopName,
      },
      product: conversation.product
        ? {
            id: conversation.product.id,
            name: conversation.product.name,
            imageUrl: conversation.product.imageUrl,
          }
        : null,
      orderId: conversation.orderId,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            type: lastMessage.type,
            createdAt: lastMessage.createdAt.toISOString(),
          }
        : null,
      unreadCount,
      updatedAt: conversation.updatedAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
    };
  }

  private mapMessage(
    message: {
      id: number;
      conversationId: number;
      senderId: number;
      senderName: string;
      content: string;
      type: string;
      isDeleted: boolean;
      createdAt: Date;
    },
    isReadByPeer: boolean
  ): MessageDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      type: message.type,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt.toISOString(),
      isRead: isReadByPeer,
    };
  }
}
