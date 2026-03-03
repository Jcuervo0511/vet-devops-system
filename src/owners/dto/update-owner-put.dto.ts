import { PartialType } from '@nestjs/mapped-types';
import { CreateOwnerDto } from './create-owner.dto';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';


export class UpdateOwnerPutDto extends PartialType(CreateOwnerDto) {
    @IsString()
    @MinLength(2)
    fullName: string;

    @IsEmail()
    email: string;

    @IsString()
    phone_number: string;

}
