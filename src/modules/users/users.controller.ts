import { Body, Controller, Get, Param, ParseIntPipe, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  getProfile(@Req() req: Request) {
    return this.usersService.getProfile(req);
  }

  @Put('me')
  updateProfile(@Req() req: Request, @Body() payload: UpdateProfileDto) {
    return this.usersService.updateProfile(req, payload);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
