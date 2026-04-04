import { Injectable } from '@nestjs/common';
import type {
  PaymentsModuleDetailResponseDto,
  PaymentsModuleListResponseDto,
} from './dto/payments-response.dto';

@Injectable()
export class PaymentsService {
  findAll(): PaymentsModuleListResponseDto {
    return {
      module: 'payments',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): PaymentsModuleDetailResponseDto {
    return {
      module: 'payments',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
