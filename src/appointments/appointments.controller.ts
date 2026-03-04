import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentPutDto } from './dto/update-appointment-put.dto';
import { UpdateAppointmentPatchDto } from './dto/update-appointment-patch.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @ApiOperation({ summary: 'Create an appointment' })
  @ApiResponse({ status: 201, description: 'Appointment successfully created'})
  @ApiResponse({ status: 404, description: 'Pet not found' })
  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @ApiOperation({ summary: 'Get all appointments' })
  @ApiResponse({ status: 200, description: 'List of appointments'})
  @Get()
  findAll() {
    return this.appointmentsService.findAll();
  }

  @ApiOperation({ summary: 'Get an appointment by id' })
  @ApiParam({ name: 'id', example: 'Appointment id' })
  @ApiResponse({ status: 200, description: 'Appointment found'})
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an appointment partially by id' })
  @ApiParam({ name: 'id', example: 'Appointment id' })
  @ApiResponse({ status: 200, description: 'Appointment partially updated'})
  @ApiResponse({ status: 404, description: 'Appointment or Pet not found' })
  @Patch(':id')
  updatePatch(@Param('id') id: string, @Body() updateAppoinmentDto: UpdateAppointmentPatchDto) {
    return this.appointmentsService.updatePatch(id, updateAppoinmentDto);
  }

  @ApiOperation({ summary: 'Update an entire appointment by id' })
  @ApiParam({ name: 'id', example: 'Appointment id' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully'})
  @ApiResponse({ status: 404, description: 'Appointment or Pet not found' })
  @Put(':id')
  updatePut(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentPutDto) {
    return this.appointmentsService.updatePut(id, updateAppointmentDto);
  }

  @ApiOperation({ summary: 'Delete an appointment by id' })
  @ApiParam({ name: 'id', example: 'Appointment id' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}