import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  findAll() {
    return {
      module: 'chat',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number) {
    return {
      module: 'chat',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
