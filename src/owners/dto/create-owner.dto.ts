import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateOwnerDto {
    
    @IsString()
    @MinLength(2)
    @ApiProperty({example: 'Juan Cuervo'})
    fullName: string;

    @ApiProperty({example: 'juan@test.com'})
    @IsEmail()
    email: string;

    @ApiProperty({example: '3001234567'})
    @IsString()
    phone_number: string;


}