import { PartialType } from '@nestjs/mapped-types';
import { CreateOwnerDto } from './create-owner.dto';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateOwnerPatchDto extends PartialType(CreateOwnerDto) {

    @ApiProperty({ example: 'Juan Cuervo' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    fullName?: string;

    @ApiProperty({ example: 'juan@test.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: '3001234567' })
    @IsOptional()
    @IsString()
    phone_number?: string;
}
