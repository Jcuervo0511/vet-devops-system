import { ConflictException, Injectable } from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerPutDto } from './dto/update-owner-put.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Owner } from './entities/owner.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OwnersService {
  constructor(
    @InjectRepository(Owner)
    private readonly ownersRepo: Repository<Owner>
  ){}


  async create(createOwnerDto: CreateOwnerDto) {

    const existingOwner = await this.ownersRepo.findOne({ where: { email: createOwnerDto.email } });
    if (existingOwner) throw new ConflictException('Email already exists');
    const owner = this.ownersRepo.create(createOwnerDto);
    return await this.ownersRepo.save(owner);
  }

  findAll() {
    return `This action returns all owners`;
  }

  findOne(id: number) {
    return `This action returns a #${id} owner`;
  }

  update(id: number, updateOwnerDto: UpdateOwnerPutDto) {
    return `This action updates a #${id} owner`;
  }

  remove(id: number) {
    return `This action removes a #${id} owner`;
  }
}
