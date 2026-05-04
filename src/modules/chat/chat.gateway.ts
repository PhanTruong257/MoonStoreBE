import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import {
  ACCESS_COOKIE_NAME,
  getAccessSecret,
} from '../../common/auth/auth-token.helper';

const parseCookies = (header: string | undefined): Record<string, string> => {
  if (!header) {
    return {};
  }
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const eq = part.indexOf('=');
        if (eq < 0) {
          return [part, ''] as const;
        }
        const key = part.slice(0, eq).trim();
        const value = decodeURIComponent(part.slice(eq + 1).trim());
        return [key, value] as const;
      })
  );
};

const getCorsOrigin = () => {
  const raw = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  return raw.split(',').map((origin) => origin.trim());
};

@WebSocketGateway({
  cors: {
    origin: getCorsOrigin(),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(socket: Socket) {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies[ACCESS_COOKIE_NAME];
    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: number }>(token, {
        secret: getAccessSecret(),
      });
      const userId = payload.sub;
      socket.data.userId = userId;
      void socket.join(this.userRoom(userId));
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId as number | undefined;
    if (userId) {
      this.logger.debug(`User ${userId} disconnected`);
    }
  }

  emitToUsers(userIds: number[], event: string, payload: unknown) {
    const unique = Array.from(new Set(userIds));
    for (const userId of unique) {
      this.server.to(this.userRoom(userId)).emit(event, payload);
    }
  }

  private userRoom(userId: number) {
    return `user-${userId}`;
  }
}
