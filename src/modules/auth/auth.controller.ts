import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() payload: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(payload, res);
  }

  @Post('login')
  login(@Body() payload: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(payload, res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.authService.me(req);
  }
}
