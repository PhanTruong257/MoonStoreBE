import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AdminService } from './admin.service';
import type {
  AdminPromoteAdminResponseDto,
  AdminSellerActionResponseDto,
  AdminSellerListResponseDto,
  AdminStatsResponseDto,
  AdminUserListResponseDto,
} from './dto/admin-response.dto';
import type { RejectSellerDto } from './dto/reject-seller.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats(@Req() req: Request): Promise<AdminStatsResponseDto> {
    return this.adminService.getStats(req);
  }

  @Get('users')
  listUsers(@Req() req: Request, @Query('role') role?: string): Promise<AdminUserListResponseDto> {
    return this.adminService.listUsers(req, role?.trim() || undefined);
  }

  @Patch('users/:userId/promote-admin')
  promoteAdmin(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number
  ): Promise<AdminPromoteAdminResponseDto> {
    return this.adminService.promoteToAdmin(req, userId);
  }

  @Get('sellers')
  listSellers(
    @Req() req: Request,
    @Query('status') status?: string
  ): Promise<AdminSellerListResponseDto> {
    return this.adminService.listSellers(req, status?.trim() || undefined);
  }

  @Patch('sellers/:sellerId/approve')
  approveSeller(
    @Req() req: Request,
    @Param('sellerId', ParseIntPipe) sellerId: number
  ): Promise<AdminSellerActionResponseDto> {
    return this.adminService.approveSeller(req, sellerId);
  }

  @Patch('sellers/:sellerId/reject')
  rejectSeller(
    @Req() req: Request,
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Body() payload: RejectSellerDto
  ): Promise<AdminSellerActionResponseDto> {
    return this.adminService.rejectSeller(req, sellerId, payload);
  }

  @Patch('users/:userId/disable')
  disableUser(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number
  ): Promise<AdminPromoteAdminResponseDto> {
    return this.adminService.setUserStatus(req, userId, 'disabled');
  }

  @Patch('users/:userId/enable')
  enableUser(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number
  ): Promise<AdminPromoteAdminResponseDto> {
    return this.adminService.setUserStatus(req, userId, 'active');
  }

  @Patch('sellers/:sellerId/disable')
  disableSeller(
    @Req() req: Request,
    @Param('sellerId', ParseIntPipe) sellerId: number
  ): Promise<AdminSellerActionResponseDto> {
    return this.adminService.setSellerStatus(req, sellerId, 'disabled');
  }

  @Patch('sellers/:sellerId/enable')
  enableSeller(
    @Req() req: Request,
    @Param('sellerId', ParseIntPipe) sellerId: number
  ): Promise<AdminSellerActionResponseDto> {
    return this.adminService.setSellerStatus(req, sellerId, 'active');
  }
}
