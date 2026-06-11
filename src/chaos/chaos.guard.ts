import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ChaosAccessService } from './chaos-access.service';

@Injectable()
export class ChaosGuard implements CanActivate {
  constructor(private readonly chaosAccessService: ChaosAccessService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    this.chaosAccessService.assertAllowed(request);
    return true;
  }
}
