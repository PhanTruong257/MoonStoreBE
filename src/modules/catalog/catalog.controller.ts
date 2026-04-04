import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  findAll() {
    return this.catalogService.findAll();
  }

  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Get('products')
  listProducts() {
    return this.catalogService.listProducts();
  }

  @Get('products/:id')
  getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.getProductDetail(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.findOne(id);
  }
}
