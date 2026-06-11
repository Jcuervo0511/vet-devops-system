import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { isEnabled } from './chaos.constants';

@Injectable()
export class ChaosAccessService {
  constructor(private readonly configService: ConfigService) {}

  assertAllowed(request: Request): void {
    if (!isEnabled(this.configService.get<string>('CHAOS_ENABLED'))) {
      throw new NotFoundException('Chaos experiments are disabled');
    }

    const expectedKey = this.configService.get<string>('CHAOS_KEY');
    if (!expectedKey) {
      throw new ServiceUnavailableException('Chaos key is not configured');
    }

    if (request.header('x-chaos-key') !== expectedKey) {
      throw new ForbiddenException('Invalid chaos key');
    }
  }
}
