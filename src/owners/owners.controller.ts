import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerPutDto } from './dto/update-owner-put.dto';
import { UpdateOwnerPatchDto } from './dto/update-owner-patch-dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('owners')
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) { }

  @ApiOperation({summary: 'Create an owner'})
  @ApiResponse({ status: 201, description: 'Owner successfully created'})
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Post()
  create(@Body() createOwnerDto: CreateOwnerDto) {
    return this.ownersService.create(createOwnerDto);
  }

  @ApiOperation({summary: 'Get all owners'})
  @ApiResponse({ status: 200, description: 'List of owners'})
  @Get()
  findAll() {
    return this.ownersService.findAll();
  }

  @ApiOperation({summary: 'Get an owner by id'})
  @ApiParam({ name: 'id', example: 'This is the owner id' })
  @ApiResponse({ status: 200, description: 'Owner found'})
  @ApiResponse({ status: 404, description: 'Owner not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ownersService.findOne(id);
  }


  @ApiOperation({summary: 'Update an entire owner by id'})
  @ApiParam({ name: 'id', example: 'This is the owner id' })
  @ApiResponse({ status: 200, description: 'Owner updated successfully'})
  @ApiResponse({ status: 404, description: 'Owner not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Put(':id')
  put(@Param('id') id: string, @Body() updateOwnerDto: UpdateOwnerPutDto) {
    return this.ownersService.updatePut(id, updateOwnerDto);
  }


  @ApiOperation({summary: 'Update an owner partially by id'})
  @ApiParam({ name: 'id', example: 'This is the owner id' })
  @ApiResponse({ status: 200, description: 'Owner partially updated'})
  @ApiResponse({ status: 404, description: 'Owner not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Patch(':id')
  patch(@Param('id') id: string, @Body() updateOwnerDto: UpdateOwnerPatchDto) {
    return this.ownersService.updatePatch(id, updateOwnerDto);
  }


  @ApiOperation({summary: 'Delete an owner by id'})
  @ApiParam({ name: 'id', example: 'This is the owner id' })
  @ApiResponse({ status: 200, description: 'Owner deleted successfully' })
  @ApiResponse({ status: 404, description: 'Owner not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ownersService.remove(id);
  }

  @Post('api/v2/chain')
  chain(@Body() body: { lasso: any; cuervo: any }) {
    return this.ownersService.chain(body);
  }



}
