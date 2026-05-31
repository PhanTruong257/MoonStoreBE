import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { ShipperService } from './shipper.service';
import type { CreateShipperDto } from './dto/create-shipper.dto';
import type { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';

@Controller('shipper')
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

  @Post('apply')
  apply(
    @Req() req: Request,
    @Body() payload: CreateShipperDto,
  ) {
    return this.shipperService.applyShipper(req, payload);
  }

  @Get('profile')
  getProfile(@Req() req: Request) {
    return this.shipperService.getMyProfile(req);
  }

  @Get('shipments')
  getShipments(@Req() req: Request) {
    return this.shipperService.getMyShipments(req);
  }

  @Patch('shipments/:id/status')
  updateStatus(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateShipmentStatusDto,
  ) {
    return this.shipperService.updateShipmentStatus(req, id, payload);
  }
}
