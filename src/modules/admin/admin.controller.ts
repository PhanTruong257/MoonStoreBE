import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { SELLER_STATUS, USER_STATUS } from '../../common/constants';
import { AdminService } from './admin.service';
import type {
  AdminPromoteAdminResponseDto,
  AdminSellerActionResponseDto,
  AdminSellerListResponseDto,
  AdminStatsResponseDto,
  AdminUserListResponseDto,
} from './dto/admin-response.dto';
import type { GrantUserRoleDto } from './dto/grant-user-role.dto';
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

  @Patch('users/:userId/grant-role')
  grantUserRole(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() payload: GrantUserRoleDto
  ) {
    return this.adminService.grantUserRole(req, userId, payload);
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
    return this.adminService.setUserStatus(req, userId, USER_STATUS.DISABLED);
  }

  @Patch('users/:userId/enable')
  enableUser(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number
  ): Promise<AdminPromoteAdminResponseDto> {
    return this.adminService.setUserStatus(req, userId, USER_STATUS.ACTIVE);
  }

  @Patch('sellers/:sellerId/disable')
  disableSeller(
    @Req() req: Request,
    @Param('sellerId', ParseIntPipe) sellerId: number
  ): Promise<AdminSellerActionResponseDto> {
    return this.adminService.setSellerStatus(req, sellerId, SELLER_STATUS.DISABLED);
  }

  @Patch('sellers/:sellerId/enable')
  enableSeller(
    @Req() req: Request,
    @Param('sellerId', ParseIntPipe) sellerId: number
  ): Promise<AdminSellerActionResponseDto> {
    return this.adminService.setSellerStatus(req, sellerId, SELLER_STATUS.ACTIVE);
  }

  @Get('config/commission')
  getCommissionRate(@Req() req: Request) {
    return this.adminService.getCommissionRate(req);
  }

  @Patch('config/commission')
  setCommissionRate(@Req() req: Request, @Body() body: { rate: number }) {
    return this.adminService.setCommissionRate(req, body.rate);
  }

  @Get('refund-requests')
  listRefundRequests(@Req() req: Request, @Query('status') status?: string) {
    return this.adminService.listRefundRequests(req, status?.trim() || undefined);
  }

  @Patch('refund-requests/:id/approve')
  approveRefundRequest(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { note?: string }
  ) {
    return this.adminService.processRefundRequest(req, id, true, body.note);
  }

  @Patch('refund-requests/:id/reject')
  rejectRefundRequest(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { note?: string }
  ) {
    return this.adminService.processRefundRequest(req, id, false, body.note);
  }

  @Get('withdrawals')
  listWithdrawals(@Req() req: Request, @Query('status') status?: string) {
    return this.adminService.listWithdrawalRequests(req, status?.trim() || undefined);
  }

  @Patch('withdrawals/:id/approve')
  approveWithdrawal(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { note?: string }
  ) {
    return this.adminService.processWithdrawal(req, id, true, body.note);
  }

  @Patch('withdrawals/:id/reject')
  rejectWithdrawal(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { note?: string }
  ) {
    return this.adminService.processWithdrawal(req, id, false, body.note);
  }

  @Get('revenue')
  getRevenueReport(@Req() req: Request) {
    return this.adminService.getRevenueReport(req);
  }

  @Get('shippers')
  listShippers(@Req() req: Request, @Query('status') status?: string) {
    return this.adminService.listShippers(req, status?.trim() || undefined);
  }

  @Patch('shippers/:id/approve')
  approveShipper(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.approveShipper(req, id);
  }

  @Patch('shippers/:id/reject')
  rejectShipper(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string }
  ) {
    return this.adminService.rejectShipper(req, id, body.reason);
  }

  @Patch('shippers/:id/disable')
  disableShipper(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.setShipperStatus(req, id, 'disabled');
  }

  @Patch('shippers/:id/enable')
  enableShipper(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.setShipperStatus(req, id, 'active');
  }

  @Get('shipments')
  listShipments(@Req() req: Request, @Query('status') status?: string) {
    return this.adminService.listShipments(req, status?.trim() || undefined);
  }

  @Get('shippers/active')
  listActiveShippers(@Req() req: Request) {
    return this.adminService.listActiveShippers(req);
  }

  @Patch('shipments/:shipmentId/assign')
  assignShipper(
    @Req() req: Request,
    @Param('shipmentId', ParseIntPipe) shipmentId: number,
    @Body() body: { shipperId: number }
  ) {
    return this.adminService.assignShipper(req, shipmentId, body.shipperId);
  }

  @Get('return-requests')
  listReturnRequests(@Req() req: Request, @Query('status') status?: string) {
    return this.adminService.listReturnRequests(req, status?.trim() || undefined);
  }

  @Patch('return-requests/:id/complete')
  completeReturnRequest(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { note?: string }
  ) {
    return this.adminService.completeReturnRequest(req, id, body.note);
  }
}
