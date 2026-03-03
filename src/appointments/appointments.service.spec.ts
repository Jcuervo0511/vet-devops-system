import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { Pet } from 'src/pets/entities/pet.entity';
import { AppointmentStatus } from './enums/appointment-status.enum';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const appointmentsRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const petsRepoMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: appointmentsRepoMock },
        { provide: getRepositoryToken(Pet), useValue: petsRepoMock },
      ],
    }).compile();

    service = moduleRef.get(AppointmentsService);
    jest.clearAllMocks();
  });

  it('create throws NotFoundException if pet does not exist', async () => {
    petsRepoMock.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        petId: '11111111-1111-1111-1111-111111111111',
        appointmentDate: '2026-03-10T10:00:00.000Z',
        reason: 'Vaccination',
        status: AppointmentStatus.SCHEDULED,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create saves appointment if pet exists (default status)', async () => {
    petsRepoMock.findOne.mockResolvedValue({ id: 'pet-uuid' } as unknown as Pet);

    appointmentsRepoMock.create.mockImplementation((x: any) => x);
    appointmentsRepoMock.save.mockResolvedValue({
      id: 'appt-uuid',
      petId: 'pet-uuid',
      reason: 'Vaccination',
      status: AppointmentStatus.SCHEDULED,
    });

    const result = await service.create({
      petId: 'pet-uuid',
      appointmentDate: '2026-03-10T10:00:00.000Z',
      reason: 'Vaccination',
      // status omitted -> default in service
    } as any);

    expect(petsRepoMock.findOne).toHaveBeenCalled();
    expect(appointmentsRepoMock.create).toHaveBeenCalled();
    expect(appointmentsRepoMock.save).toHaveBeenCalled();
    expect(result.id).toBe('appt-uuid');
    expect(result.status).toBe(AppointmentStatus.SCHEDULED);
  });

  it('findAll returns appointments array', async () => {
    appointmentsRepoMock.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);

    const result = await service.findAll();

    expect(appointmentsRepoMock.find).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  it('findOne throws NotFoundException if appointment not found', async () => {
    appointmentsRepoMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updatePut validates petId when it changes and saves', async () => {
    // findOne(id) -> appointment existente
    appointmentsRepoMock.findOne.mockResolvedValueOnce({
      id: 'appt-uuid',
      petId: 'pet-old',
      appointmentDate: new Date('2026-03-10T10:00:00.000Z'),
      reason: 'Old reason',
      status: AppointmentStatus.SCHEDULED,
    } as unknown as Appointment);

    // petId cambia -> validar pet nuevo existe
    petsRepoMock.findOne.mockResolvedValueOnce({ id: 'pet-new' } as unknown as Pet);

    appointmentsRepoMock.save.mockResolvedValueOnce({
      id: 'appt-uuid',
      petId: 'pet-new',
      reason: 'New reason',
      status: AppointmentStatus.COMPLETED,
    });

    const result = await service.updatePut('appt-uuid', {
      petId: 'pet-new',
      appointmentDate: '2026-03-11T10:00:00.000Z',
      reason: 'New reason',
      status: AppointmentStatus.COMPLETED,
    } as any);

    expect(petsRepoMock.findOne).toHaveBeenCalled();
    expect(appointmentsRepoMock.save).toHaveBeenCalled();
    expect(result.petId).toBe('pet-new');
  });

  it('updatePatch throws NotFoundException if new petId does not exist', async () => {
    appointmentsRepoMock.findOne.mockResolvedValueOnce({
      id: 'appt-uuid',
      petId: 'pet-old',
      appointmentDate: new Date(),
      reason: 'x',
      status: AppointmentStatus.SCHEDULED,
    } as unknown as Appointment);

    petsRepoMock.findOne.mockResolvedValueOnce(null);

    await expect(
      service.updatePatch('appt-uuid', { petId: 'pet-new' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updatePatch converts appointmentDate when provided and saves', async () => {
    const existing = {
      id: 'appt-uuid',
      petId: 'pet-old',
      appointmentDate: new Date('2026-03-10T10:00:00.000Z'),
      reason: 'Old',
      status: AppointmentStatus.SCHEDULED,
    } as unknown as Appointment;

    appointmentsRepoMock.findOne.mockResolvedValueOnce(existing);
    appointmentsRepoMock.save.mockResolvedValueOnce({
      ...existing,
      appointmentDate: new Date('2026-03-12T10:00:00.000Z'),
    });

    const result = await service.updatePatch('appt-uuid', {
      appointmentDate: '2026-03-12T10:00:00.000Z',
    } as any);

    expect(appointmentsRepoMock.save).toHaveBeenCalled();
    expect(new Date(result.appointmentDate).toISOString()).toBe('2026-03-12T10:00:00.000Z');
  });

  it('remove deletes appointment if exists', async () => {
    appointmentsRepoMock.findOne.mockResolvedValueOnce({ id: 'appt-uuid' } as unknown as Appointment);
    appointmentsRepoMock.remove.mockResolvedValueOnce({});

    const result = await service.remove('appt-uuid');

    expect(appointmentsRepoMock.remove).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });
});