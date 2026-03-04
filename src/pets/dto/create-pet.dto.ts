import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreatePetDto {

    @ApiProperty({ example: 'Toby' })
    @IsString()
    @MinLength(1)
    name: string;

    @ApiProperty({ example: 'Dog' })
    @IsString()
    @MinLength(1)
    species: string;

    @ApiProperty({ example: 'Golden Retriever' })
    @IsOptional()
    @IsString()
    breed?: string;

    @ApiProperty({ example: '2020-05-10' })
    @IsOptional()
    @IsString()
    birthDate?: string;

    @ApiProperty({ example: 'b6d7fffb-4a90-4418-bb93-8d10931fcf73' })
    @IsUUID()
    ownerId: string;
}
