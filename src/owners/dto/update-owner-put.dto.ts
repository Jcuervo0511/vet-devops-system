import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateOwnerPutDto {

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
