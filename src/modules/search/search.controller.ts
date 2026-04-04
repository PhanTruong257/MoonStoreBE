import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SearchService } from './search.service';
import type {
  SearchModuleDetailResponseDto,
  SearchModuleListResponseDto,
} from './dto/search-response.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  findAll(): SearchModuleListResponseDto {
    return this.searchService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): SearchModuleDetailResponseDto {
    return this.searchService.findOne(id);
  }
}
