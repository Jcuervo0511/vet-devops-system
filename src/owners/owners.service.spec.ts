import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { OwnersService } from './owners.service';
import { Owner } from './entities/owner.entity';

describe('OwnersService', () => {
  let service: OwnersService;
  let repo: Repository<Owner>;

  const repoMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
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
    repo = moduleRef.get(getRepositoryToken(Owner));
    jest.clearAllMocks();
  });

  it('should throw ConflictException if email already exists', async () => {
    repoMock.findOne.mockResolvedValue({ id: '1' } as Owner);

    await expect(
      service.create({ fullName: 'Juan', email: 'juan@test.com', phone_number: '1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should create owner if email does not exist', async () => {
    repoMock.findOne.mockResolvedValue(null);
    repoMock.create.mockReturnValue({ fullName: 'Juan' });
    repoMock.save.mockResolvedValue({ id: 'uuid', fullName: 'Juan' });

    const result = await service.create({
      fullName: 'Juan',
      email: 'juan@test.com',
      phone_number: '1',
    });

    expect(repoMock.findOne).toHaveBeenCalled();
    expect(repoMock.create).toHaveBeenCalled();
    expect(repoMock.save).toHaveBeenCalled();
    expect(result.id).toBe('uuid');
  });

  it('findOne should throw NotFoundException when owner does not exist', async () => {
    repoMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});