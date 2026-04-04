import { Injectable } from '@nestjs/common';
import type {
  ChatModuleDetailResponseDto,
  ChatModuleListResponseDto,
} from './dto/chat-response.dto';

@Injectable()
export class ChatService {
  findAll(): ChatModuleListResponseDto {
    return {
      module: 'chat',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): ChatModuleDetailResponseDto {
    return {
      module: 'chat',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
