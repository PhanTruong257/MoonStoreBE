import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type {
  UserProfileResponseDto,
  UsersModuleDetailResponseDto,
  UsersModuleListResponseDto,
} from './dto/users-response.dto';
import type {
  CreateAddressDto,
  UpdateAddressDto,
  UserAddressListResponseDto,
  UserAddressResponseDto,
} from './dto/address.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): UsersModuleListResponseDto {
    return this.usersService.findAll();
  }

  @Get('me')
  getProfile(@Req() req: Request): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(req);
  }

  @Put('me')
  updateProfile(
    @Req() req: Request,
    @Body() payload: UpdateProfileDto
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(req, payload);
  }

  @Get('me/addresses')
  listAddresses(@Req() req: Request): Promise<UserAddressListResponseDto> {
    return this.usersService.listAddresses(req);
  }

  @Post('me/addresses')
  createAddress(
    @Req() req: Request,
    @Body() payload: CreateAddressDto
  ): Promise<UserAddressResponseDto> {
    return this.usersService.createAddress(req, payload);
  }

  @Patch('me/addresses/:id')
  updateAddress(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateAddressDto
  ): Promise<UserAddressResponseDto> {
    return this.usersService.updateAddress(req, id, payload);
  }

  @Delete('me/addresses/:id')
  deleteAddress(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ id: number }> {
    return this.usersService.deleteAddress(req, id);
  }

  @Patch('me/addresses/:id/default')
  setDefault(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number
  ): Promise<UserAddressResponseDto> {
    return this.usersService.setDefaultAddress(req, id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): UsersModuleDetailResponseDto {
    return this.usersService.findOne(id);
  }
}
