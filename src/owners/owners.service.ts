import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerPutDto } from './dto/update-owner-put.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Owner } from './entities/owner.entity';
import { Repository } from 'typeorm';
import { UpdateOwnerPatchDto } from './dto/update-owner-patch-dto';

@Injectable()
export class OwnersService {
  constructor(
    @InjectRepository(Owner)
    private readonly ownersRepo: Repository<Owner>
  ) { }


  async create(createOwnerDto: CreateOwnerDto) {

    const existingOwner = await this.ownersRepo.findOne({ where: { email: createOwnerDto.email } });
    if (existingOwner) throw new ConflictException('Email already exists');
    const owner = this.ownersRepo.create(createOwnerDto);
    return await this.ownersRepo.save(owner);
  }

  async findAll() {
    return await this.ownersRepo.find();
  }

  async findOne(id: string) {

    const owner = await this.ownersRepo.findOne({ where: { id } });

    if (!owner) throw new NotFoundException('Owner not found');

    return owner;
  }

  async updatePut(id: string, updateOwnerDto: UpdateOwnerPutDto) {
    const owner = await this.findOne(id);

    if (updateOwnerDto.email !== owner.email) {
      const existing = await this.ownersRepo.findOne({ where: { email: updateOwnerDto.email } });
      if (existing) throw new ConflictException('Email already exists');
    }

    owner.fullName = updateOwnerDto.fullName;
    owner.email = updateOwnerDto.email;
    owner.phone_number = updateOwnerDto.phone_number;

    return await this.ownersRepo.save(owner);
  }

  async updatePatch(id: string, updateOwnerDto: UpdateOwnerPatchDto) {
    const owner = await this.findOne(id);
    if (updateOwnerDto.email && updateOwnerDto.email !== owner.email) {
      const existing = await this.ownersRepo.findOne({where: {email: updateOwnerDto.email}});
      if (existing) throw new ConflictException('Email already exists');

    }

    Object.assign(owner, updateOwnerDto);
    return await this.ownersRepo.save(owner);
  }

  remove(id: number) {
    return `This action removes a #${id} owner`;
  }
}
