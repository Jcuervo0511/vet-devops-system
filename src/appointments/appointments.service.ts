import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Repository } from 'typeorm';
import { Pet } from 'src/pets/entities/pet.entity';
import { AppointmentStatus } from './enums/appointment-status.enum';

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

  findAll() {
    return `This action returns all appointments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} appointment`;
  }

  update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    return `This action updates a #${id} appointment`;
  }

  remove(id: number) {
    return `This action removes a #${id} appointment`;
  }
}
