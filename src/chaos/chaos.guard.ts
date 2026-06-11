import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { isEnabled } from './chaos.constants';

@Injectable()
export class ChaosGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (!isEnabled(this.configService.get<string>('CHAOS_ENABLED'))) {
      throw new NotFoundException();
    }

    const expectedKey = this.configService.get<string>('CHAOS_KEY');
    if (!expectedKey) {
      throw new ServiceUnavailableException('Chaos key is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (request.header('x-chaos-key') !== expectedKey) {
      throw new ForbiddenException('Invalid chaos key');
    }

    return true;
  }
}
