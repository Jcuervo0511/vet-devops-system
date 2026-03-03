import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetPutDto } from './dto/update-pet-put.dto';
import { UpdatePetPatchDto } from './dto/update-pet-patch.dto';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  create(@Body() createPetDto: CreatePetDto) {
    return this.petsService.create(createPetDto);
  }

  @Get()
  findAll() {
    return this.petsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Put(':id')
  updatePut(@Param('id') id: string, @Body() updatePetDto: UpdatePetPutDto) {
    return this.petsService.updatePut(id, updatePetDto);
  }

  @Patch(':id')
  updatePatch(@Param('id') id: string, @Body() updatePetDto: UpdatePetPatchDto){
    return this.petsService.updatePatch(id, updatePetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.petsService.remove(id);
  }
}
