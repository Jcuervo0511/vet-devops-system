import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { PetsService } from './pets.service';
import { Pet } from './entities/pet.entity';
import { Owner } from 'src/owners/entities/owner.entity';

describe('PetsService', () => {
  let service: PetsService;

  const petsRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const ownersRepoMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PetsService,
        { provide: getRepositoryToken(Pet), useValue: petsRepoMock },
        { provide: getRepositoryToken(Owner), useValue: ownersRepoMock },
      ],
    }).compile();

    service = moduleRef.get(PetsService);
    jest.clearAllMocks();
  });

  it('create throws NotFoundException if owner does not exist', async () => {
    ownersRepoMock.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        name: 'Toby',
        species: 'Dog',
        breed: 'Pastor Aleman',
        birthDate: '2020-01-10',
        ownerId: '11111111-1111-1111-1111-111111111111',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create saves pet if owner exists', async () => {
    ownersRepoMock.findOne.mockResolvedValue({ id: 'owner-uuid' } as Owner);

    petsRepoMock.create.mockReturnValue({
      name: 'Toby',
      species: 'Dog',
      breed: 'Pastor Aleman',
      birthDate: '2020-01-10',
      ownerId: 'owner-uuid',
    });

    petsRepoMock.save.mockResolvedValue({
      id: 'pet-uuid',
      name: 'Toby',
      species: 'Dog',
      breed: 'Pastor Aleman',
      birthDate: '2020-01-10',
      ownerId: 'owner-uuid',
    });

    const result = await service.create({
      name: 'Toby',
      species: 'Dog',
      breed: 'Pastor Aleman',
      birthDate: '2020-01-10',
      ownerId: 'owner-uuid',
    });

    expect(ownersRepoMock.findOne).toHaveBeenCalled();
    expect(petsRepoMock.create).toHaveBeenCalled();
    expect(petsRepoMock.save).toHaveBeenCalled();
    expect(result.id).toBe('pet-uuid');
  });

  it('findAll returns pets array', async () => {
    petsRepoMock.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);

    const result = await service.findAll();

    expect(petsRepoMock.find).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  it('findOne throws NotFoundException if pet not found', async () => {
    petsRepoMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('pet-uuid')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updatePut updates pet and saves', async () => {
    petsRepoMock.findOne.mockResolvedValue({
      id: 'pet-uuid',
      name: 'Old',
      species: 'Dog',
      breed: null,
      birthDate: null,
      ownerId: 'owner-old',
    } as unknown as Pet);

    ownersRepoMock.findOne.mockResolvedValue({ id: 'owner-new' } as Owner);

    petsRepoMock.save.mockResolvedValue({ id: 'pet-uuid', name: 'New' });

    const result = await service.updatePut('pet-uuid', {
      name: 'New',
      species: 'Dog',
      breed: 'Labrador',
      birthDate: '2020-01-10',
      ownerId: 'owner-new',
    });

    expect(ownersRepoMock.findOne).toHaveBeenCalled();
    expect(petsRepoMock.save).toHaveBeenCalled();
    expect(result.id).toBe('pet-uuid');
  });

  it('updatePatch throws if new ownerId does not exist', async () => {
    petsRepoMock.findOne.mockResolvedValue({ id: 'pet-uuid', ownerId: 'owner-old' } as Pet);
    ownersRepoMock.findOne.mockResolvedValue(null);

    await expect(
      service.updatePatch('pet-uuid', { ownerId: 'owner-new' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove deletes pet if exists', async () => {
    petsRepoMock.findOne.mockResolvedValue({ id: 'pet-uuid' } as Pet);
    petsRepoMock.remove.mockResolvedValue({});

    const result = await service.remove('pet-uuid');

    expect(petsRepoMock.remove).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });
});