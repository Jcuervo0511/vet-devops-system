import { PartialType } from '@nestjs/mapped-types';
import { CreatePetDto } from './create-pet.dto';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdatePetPatchDto extends PartialType(CreatePetDto) {
    @IsOptional()
    @IsString()
    @MinLength(1)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    species?: string;

    @IsOptional()
    @IsString()
    breed?: string;

    @IsOptional()
    @IsString()
    birthDate?: string;

    @IsOptional()
    @IsUUID()
    ownerId?: string;
}
