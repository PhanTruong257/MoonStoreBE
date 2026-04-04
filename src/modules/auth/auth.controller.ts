import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', example: 'jane@example.com' },
        password: { type: 'string', example: 'secret123' },
        phone: { type: 'string', example: '0900000000' },
      },
      required: ['fullName', 'email', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Registered user information',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'jane@example.com' },
            fullName: { type: 'string', example: 'Jane Doe' },
            role: { type: 'string', example: 'buyer' },
          },
        },
      },
    },
  })
  register(@Body() payload: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(payload, res);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'jane@example.com' },
        password: { type: 'string', example: 'secret123' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logged in user information',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'jane@example.com' },
            fullName: { type: 'string', example: 'Jane Doe' },
            role: { type: 'string', example: 'buyer' },
          },
        },
      },
    },
  })
  login(@Body() payload: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(payload, res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logout confirmation' })
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'jane@example.com' },
            fullName: { type: 'string', example: 'Jane Doe' },
            role: { type: 'string', example: 'buyer' },
          },
        },
      },
    },
  })
  me(@Req() req: Request) {
    return this.authService.me(req);
  }
}
