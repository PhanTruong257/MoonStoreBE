import { Injectable } from '@nestjs/common';
import type {
  SellersModuleDetailResponseDto,
  SellersModuleListResponseDto,
} from './dto/sellers-response.dto';

@Injectable()
export class SellersService {
  findAll(): SellersModuleListResponseDto {
    return {
      module: 'sellers',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): SellersModuleDetailResponseDto {
    return {
      module: 'sellers',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
