import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentPutDto } from './dto/update-appointment-put.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Repository } from 'typeorm';
import { Pet } from 'src/pets/entities/pet.entity';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { UpdateAppointmentPatchDto } from './dto/update-appointment-patch.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepo: Repository<Appointment>,
    @InjectRepository(Pet)
    private readonly petsRepo: Repository<Pet>,
  ) { }

  async create(dto: CreateAppointmentDto) {
    const pet = await this.petsRepo.findOne({ where: { id: dto.petId } });
    if (!pet) throw new NotFoundException('Pet not found');

    const appointment = this.appointmentsRepo.create({
      petId: dto.petId,
      appointmentDate: new Date(dto.appointmentDate),
      reason: dto.reason,
      status: dto.status ?? AppointmentStatus.SCHEDULED,
    });

    return this.appointmentsRepo.save(appointment);
  }

  async findAll() {
    return await this.appointmentsRepo.find();
  }

  async findOne(id: string) {
    const appointment = await this.appointmentsRepo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async updatePut(id: string, updateAppointmentDto: UpdateAppointmentPutDto) {
    const appointment = await this.findOne(id);
    if (updateAppointmentDto.petId !== appointment.id) {
      const pet = await this.petsRepo.findOne({ where: { id: updateAppointmentDto.petId } });
      if (!pet) throw new NotFoundException('Pet not found');
    }
    appointment.petId = updateAppointmentDto.petId;
    appointment.appointmentDate = new Date(updateAppointmentDto.appointmentDate);
    appointment.reason = updateAppointmentDto.reason;
    appointment.status = updateAppointmentDto.status;

    return this.appointmentsRepo.save(appointment);
  }

  async updatePatch(id: string, updateAppoinmentDto: UpdateAppointmentPatchDto) {
    const appointment = await this.findOne(id);
    if (updateAppoinmentDto.petId && updateAppoinmentDto.petId !== appointment.petId) {
      const pet = await this.petsRepo.findOne({ where: { id: updateAppoinmentDto.petId } });
      if (!pet) throw new NotFoundException('Pet not found');
    }

    const partial_appointment: Partial<Appointment> = {
      ...updateAppoinmentDto,
      appointmentDate: updateAppoinmentDto.appointmentDate ? new Date(updateAppoinmentDto.appointmentDate) : appointment.appointmentDate,
    };

    Object.assign(appointment, partial_appointment);
    return this.appointmentsRepo.save(appointment);

  }

  remove(id: string) {
    return `This action removes a #${id} appointment`;
  }
}
