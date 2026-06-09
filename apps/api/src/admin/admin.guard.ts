import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedPin = this.config.get<string>('ADMIN_PIN') ?? '123456';
    const suppliedPin = request.header('x-admin-pin');

    if (suppliedPin === expectedPin) {
      return true;
    }

    throw new UnauthorizedException('Invalid admin PIN');
  }
}
