import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreatePetDto {

    @IsString()
    @MinLength(1)
    name: string;

    @IsString()
    @MinLength(1)
    species: string;

    @IsOptional()
    @IsString()
    breed?: string;

    @IsOptional()
    @IsString()
    birthDate?: string;

    @IsUUID()
    ownerId: string;
}
