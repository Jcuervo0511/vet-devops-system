import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { Repository } from 'typeorm';
import { Owner } from 'src/owners/entities/owner.entity';

@Injectable()
export class PetsService {

  constructor(
    @InjectRepository(Pet)
    private readonly petsRepo: Repository<Pet>,
    @InjectRepository(Owner)
    private readonly ownersRepo: Repository<Owner>,
  ) { }

  async create(dto: CreatePetDto) {
    const owner = await this.ownersRepo.findOne({ where: { id: dto.ownerId } });
    if (!owner) throw new NotFoundException('Owner not found');

    const pet = this.petsRepo.create({
      name: dto.name,
      species: dto.species,
      breed: dto.breed,
      birthDate: dto.birthDate,
      ownerId: dto.ownerId,
    });
    return this.petsRepo.save(pet);
  }

  findAll() {
    return `This action returns all pets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pet`;
  }

  update(id: number, updatePetDto: UpdatePetDto) {
    return `This action updates a #${id} pet`;
  }

  remove(id: number) {
    return `This action removes a #${id} pet`;
  }
}
