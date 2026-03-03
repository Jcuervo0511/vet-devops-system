import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerPutDto } from './dto/update-owner-put.dto';
import { UpdateOwnerPatchDto } from './dto/update-owner-patch-dto';

@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) { }

  @Post()
  create(@Body() createOwnerDto: CreateOwnerDto) {
    return this.ownersService.create(createOwnerDto);
  }

  @Get()
  findAll() {
    return this.ownersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ownersService.findOne(id);
  }

  @Put(':id')
  put(@Param('id') id: string, @Body() updateOwnerDto: UpdateOwnerPutDto) {
    return this.ownersService.updatePut(id, updateOwnerDto);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() updateOwnerDto: UpdateOwnerPatchDto) {
    return this.ownersService.updatePatch(id, updateOwnerDto);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ownersService.remove(id);
  }
}
