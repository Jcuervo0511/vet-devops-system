import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateOwnerDto {
    
    @IsString()
    @MinLength(2)
    fullName: string;

    @IsEmail()
    email: string;

    @IsString()
    phone_number: string;


}