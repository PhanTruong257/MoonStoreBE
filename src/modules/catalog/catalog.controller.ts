import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import type {
  CatalogCategoriesResponseDto,
  CatalogModuleDetailResponseDto,
  CatalogModuleListResponseDto,
  CatalogProductDetailResponseDto,
  CatalogProductsResponseDto,
} from './dto/catalog-response.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  findAll(): CatalogModuleListResponseDto {
    return this.catalogService.findAll();
  }

  @Get('categories')
  listCategories(): Promise<CatalogCategoriesResponseDto> {
    return this.catalogService.listCategories();
  }

  @Get('products')
  listProducts(
    @Query('categoryId') categoryIdRaw?: string,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string
  ): Promise<CatalogProductsResponseDto> {
    const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined;
    const page = pageRaw ? Number(pageRaw) : 1;
    const limit = limitRaw ? Number(limitRaw) : 8;

    return this.catalogService.listProducts({
      categoryId: Number.isFinite(categoryId) ? categoryId : undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 40) : 8,
    });
  }

  @Get('products/:id')
  getProduct(@Param('id', ParseIntPipe) id: number): Promise<CatalogProductDetailResponseDto> {
    return this.catalogService.getProductDetail(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): CatalogModuleDetailResponseDto {
    return this.catalogService.findOne(id);
  }
}
