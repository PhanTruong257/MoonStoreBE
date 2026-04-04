import { Injectable } from '@nestjs/common';
import type {
  SearchModuleDetailResponseDto,
  SearchModuleListResponseDto,
} from './dto/search-response.dto';

@Injectable()
export class SearchService {
  findAll(): SearchModuleListResponseDto {
    return {
      module: 'search',
      message: 'List endpoint scaffolded',
      tables: [],
    };
  }

  findOne(id: number): SearchModuleDetailResponseDto {
    return {
      module: 'search',
      message: 'Detail endpoint scaffolded',
      id,
    };
  }
}
