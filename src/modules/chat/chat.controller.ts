import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import type {
  ChatModuleDetailResponseDto,
  ChatModuleListResponseDto,
} from './dto/chat-response.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findAll(): ChatModuleListResponseDto {
    return this.chatService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): ChatModuleDetailResponseDto {
    return this.chatService.findOne(id);
  }
}
