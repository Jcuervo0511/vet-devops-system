import { PartialType } from '@nestjs/mapped-types';
import { CreatePetDto } from './create-pet.dto';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdatePetPutDto extends PartialType(CreatePetDto) {
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
