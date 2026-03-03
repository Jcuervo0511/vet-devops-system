import { Test } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;

  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updatePut: jest.fn(),
    updatePatch: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: AppointmentsService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(AppointmentsController);
    jest.clearAllMocks();
  });

  it('create calls service.create', async () => {
    serviceMock.create.mockResolvedValue({ id: '1' });
    const result = await controller.create({} as any);
    expect(serviceMock.create).toHaveBeenCalled();
    expect(result.id).toBe('1');
  });

  it('findAll calls service.findAll', async () => {
    serviceMock.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await controller.findAll();
    expect(serviceMock.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('findOne calls service.findOne', async () => {
    serviceMock.findOne.mockResolvedValue({ id: '1' });
    const result = await controller.findOne('1');
    expect(serviceMock.findOne).toHaveBeenCalledWith('1');
    expect(result.id).toBe('1');
  });

  it('updatePut calls service.updatePut', async () => {
    serviceMock.updatePut.mockResolvedValue({ id: '1' });
    const result = await controller.updatePut('1', {} as any);
    expect(serviceMock.updatePut).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.id).toBe('1');
  });

  it('updatePatch calls service.updatePatch', async () => {
    serviceMock.updatePatch.mockResolvedValue({ id: '1' });
    const result = await controller.updatePatch('1', {} as any);
    expect(serviceMock.updatePatch).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.id).toBe('1');
  });

  it('remove calls service.remove', async () => {
    serviceMock.remove.mockResolvedValue({ deleted: true });
    const result = await controller.remove('1');
    expect(serviceMock.remove).toHaveBeenCalledWith('1');
    expect(result).toEqual({ deleted: true });
  });
});