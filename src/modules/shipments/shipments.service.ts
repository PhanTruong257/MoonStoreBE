import { Injectable } from '@nestjs/common';
import type {
  ShipmentsModuleDetailResponseDto,
  ShipmentsModuleListResponseDto,
} from './dto/shipments-response.dto';

@Injectable()
export class ShipmentsService {
  findAll(): ShipmentsModuleListResponseDto {
    return {
      module: 'shipments',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): ShipmentsModuleDetailResponseDto {
    return {
      module: 'shipments',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
