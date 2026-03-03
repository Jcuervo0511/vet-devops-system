import { PartialType } from '@nestjs/mapped-types';
import { CreateOwnerDto } from './create-owner.dto';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';


export class UpdateOwnerPatchDto extends PartialType(CreateOwnerDto) {
    @IsOptional()
    @IsString()
    @MinLength(2)
    fullName?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone_number?: string;
}
