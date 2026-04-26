import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AdminBrandsController } from './admin-brands.controller';
import { AdminBrandsService } from './admin-brands.service';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminController } from './admin.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { AdminService } from './admin.service';
import { AdminVouchersController } from './admin-vouchers.controller';
import { AdminVouchersService } from './admin-vouchers.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AdminController,
    AdminCategoriesController,
    AdminBrandsController,
    AdminVouchersController,
    AdminOrdersController,
  ],
  providers: [
    AdminService,
    AdminCategoriesService,
    AdminBrandsService,
    AdminVouchersService,
    AdminOrdersService,
  ],
})
export class AdminModule {}
