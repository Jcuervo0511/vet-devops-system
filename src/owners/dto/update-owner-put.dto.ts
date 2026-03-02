import { PartialType } from '@nestjs/mapped-types';
import { CreateOwnerDto } from './create-owner.dto';

export class UpdateOwnerPutDto extends PartialType(CreateOwnerDto) {}
