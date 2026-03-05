import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { OwnersService } from './owners.service';
import { Owner } from './entities/owner.entity';

describe('OwnersService', () => {
  let service: OwnersService;

  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OwnersService,
        {
          provide: getRepositoryToken(Owner),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = moduleRef.get(OwnersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws ConflictException if email already exists', async () => {
      repoMock.findOne.mockResolvedValue({ id: '1' } as unknown as Owner);

      await expect(
        service.create({ fullName: 'Juan', email: 'juan@test.com', phone_number: '1' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates owner if email does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);
      repoMock.create.mockReturnValue({ fullName: 'Juan' });
      repoMock.save.mockResolvedValue({ id: 'uuid', fullName: 'Juan' });

      const result = await service.create({
        fullName: 'Juan',
        email: 'juan@test.com',
        phone_number: '1',
      } as any);

      expect(repoMock.create).toHaveBeenCalled();
      expect(repoMock.save).toHaveBeenCalled();
      expect(result.id).toBe('uuid-fake');
    });
  });

  describe('findAll', () => {
    it('returns owners array', async () => {
      repoMock.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const result = await service.findAll();

      expect(repoMock.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when owner does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns owner when exists', async () => {
      repoMock.findOne.mockResolvedValue({ id: 'ok' } as unknown as Owner);

      const result = await service.findOne('ok');

      expect(result.id).toBe('ok');
    });
  });

  describe('updatePut', () => {
    it('throws NotFoundException if owner does not exist (via findOne)', async () => {
      repoMock.findOne.mockResolvedValue(null);

      await expect(
        service.updatePut('nope', {
          fullName: 'New',
          email: 'new@test.com',
          phone_number: '2',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException if email changes to an existing email', async () => {
      // 1) findOne(id) devuelve el owner actual
      repoMock.findOne
        .mockResolvedValueOnce({ id: '1', email: 'old@test.com' } as unknown as Owner)
        // 2) luego check de email nuevo: existe
        .mockResolvedValueOnce({ id: '2', email: 'new@test.com' } as unknown as Owner);

      await expect(
        service.updatePut('1', {
          fullName: 'Juan Updated',
          email: 'new@test.com',
          phone_number: '999',
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updates and saves when email does not change', async () => {
      const ownerEntity = {
        id: '1',
        fullName: 'Old Name',
        email: 'same@test.com',
        phone_number: '1',
      } as unknown as Owner;

      // findOne(id) -> owner
      repoMock.findOne.mockResolvedValueOnce(ownerEntity);
      // como el email no cambia, NO debería consultar por email existente
      repoMock.save.mockResolvedValueOnce({ ...ownerEntity, fullName: 'New Name' });

      const result = await service.updatePut('1', {
        fullName: 'New Name',
        email: 'same@test.com',
        phone_number: '2',
      } as any);

      expect(repoMock.save).toHaveBeenCalled();
      expect(result.fullName).toBe('New Name');
    });
  });

  describe('updatePatch', () => {
    it('throws ConflictException if patch email changes to existing email', async () => {
      repoMock.findOne
        .mockResolvedValueOnce({ id: '1', email: 'old@test.com' } as unknown as Owner) // findOne(id)
        .mockResolvedValueOnce({ id: '2', email: 'dup@test.com' } as unknown as Owner); // existing email

      await expect(
        service.updatePatch('1', { email: 'dup@test.com' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('patches and saves when no email conflict', async () => {
      const ownerEntity = {
        id: '1',
        fullName: 'Old',
        email: 'old@test.com',
        phone_number: '1',
      } as unknown as Owner;

      repoMock.findOne.mockResolvedValueOnce(ownerEntity); // findOne(id)
      repoMock.save.mockResolvedValueOnce({ ...ownerEntity, phone_number: '777' });

      const result = await service.updatePatch('1', { phone_number: '777' } as any);

      expect(repoMock.save).toHaveBeenCalled();
      expect(result.phone_number).toBe('777');
    });
  });

  describe('remove', () => {
    it('throws NotFoundException if owner does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);

      await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('removes owner when exists', async () => {
      repoMock.findOne.mockResolvedValueOnce({ id: '1' } as unknown as Owner);
      repoMock.remove.mockResolvedValueOnce({});

      const result = await service.remove('1');

      expect(repoMock.remove).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });
});