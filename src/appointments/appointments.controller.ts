import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentPutDto } from './dto/update-appointment-put.dto';
import { UpdateAppointmentPatchDto } from './dto/update-appointment-patch.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  updatePatch(@Param('id') id: string, @Body() updateAppoinmentDto: UpdateAppointmentPatchDto){
    return this.appointmentsService.updatePatch(id, updateAppoinmentDto)

  }

  @Put(':id')
  updatePut(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentPutDto) {
    return this.appointmentsService.updatePut(id, updateAppointmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
