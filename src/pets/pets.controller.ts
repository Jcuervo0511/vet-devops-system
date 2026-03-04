import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetPutDto } from './dto/update-pet-put.dto';
import { UpdatePetPatchDto } from './dto/update-pet-patch.dto';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @ApiOperation({ summary: 'Create a pet' })
  @ApiResponse({ status: 201, description: 'Pet successfully created'})
  @ApiResponse({ status: 404, description: 'Owner not found' })
  @Post()
  create(@Body() createPetDto: CreatePetDto) {
    return this.petsService.create(createPetDto);
  }

  @ApiOperation({ summary: 'Get all pets' })
  @ApiResponse({ status: 200, description: 'List of pets'})
  @Get()
  findAll() {
    return this.petsService.findAll();
  }

  @ApiOperation({ summary: 'Get a pet by id' })
  @ApiParam({ name: 'id', example: 'Pet id' })
  @ApiResponse({ status: 200, description: 'Pet found'})
  @ApiResponse({ status: 404, description: 'Pet not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an entire pet by id' })
  @ApiParam({ name: 'id', example: 'Pet id' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully'})
  @ApiResponse({ status: 404, description: 'Pet or Owner not found' })
  @Put(':id')
  updatePut(@Param('id') id: string, @Body() updatePetDto: UpdatePetPutDto) {
    return this.petsService.updatePut(id, updatePetDto);
  }

  @ApiOperation({ summary: 'Update a pet partially by id' })
  @ApiParam({ name: 'id', example: 'Pet id' })
  @ApiResponse({ status: 200, description: 'Pet partially updated'})
  @ApiResponse({ status: 404, description: 'Pet or Owner not found' })
  @Patch(':id')
  updatePatch(@Param('id') id: string, @Body() updatePetDto: UpdatePetPatchDto) {
    return this.petsService.updatePatch(id, updatePetDto);
  }

  @ApiOperation({ summary: 'Delete a pet by id' })
  @ApiParam({ name: 'id', example: 'Pet id' })
  @ApiResponse({ status: 200, description: 'Pet deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.petsService.remove(id);
  }
}