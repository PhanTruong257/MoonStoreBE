import { Injectable } from '@nestjs/common';
import type {
  VouchersModuleDetailResponseDto,
  VouchersModuleListResponseDto,
} from './dto/vouchers-response.dto';

@Injectable()
export class VouchersService {
  findAll(): VouchersModuleListResponseDto {
    return {
      module: 'vouchers',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): VouchersModuleDetailResponseDto {
    return {
      module: 'vouchers',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
