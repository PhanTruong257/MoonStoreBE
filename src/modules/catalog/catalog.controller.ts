import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
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
  listProducts(): Promise<CatalogProductsResponseDto> {
    return this.catalogService.listProducts();
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
