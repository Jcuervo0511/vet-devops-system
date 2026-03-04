import { PartialType } from '@nestjs/mapped-types';
import { CreateOwnerDto } from './create-owner.dto';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateOwnerPutDto extends PartialType(CreateOwnerDto) {

    @ApiProperty({example: 'Juan Cuervo'})
    @IsString()
    @MinLength(2)
    fullName: string;

    @ApiProperty({example: 'juan@test.com'})
    @IsEmail()
    email: string;

    @ApiProperty({example: '3001234567'})
    @IsString()
    phone_number: string;

}
