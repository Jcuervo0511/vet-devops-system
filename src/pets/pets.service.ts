import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetPutDto } from './dto/update-pet-put.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { Repository } from 'typeorm';
import { Owner } from 'src/owners/entities/owner.entity';
import { UpdatePetPatchDto } from './dto/update-pet-patch.dto';

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

  async findAll() {
    return await this.petsRepo.find();;
  }

  async findOne(id: string) {
    const pet = await this.petsRepo.findOne({ where: { id } });
    if (!pet) throw new NotFoundException('Pet not found');
    return pet;
  }

  async updatePut(id: string, dto: UpdatePetPutDto) {
    const pet = await this.findOne(id);
    if (dto.ownerId !== pet.ownerId) {
      const owner = await this.ownersRepo.findOne({ where: { id: dto.ownerId } });
      if (!owner) throw new NotFoundException('Owner not found');
    }

    pet.name = dto.name;
    pet.species = dto.species;
    pet.breed = dto.breed;
    pet.birthDate = dto.birthDate;
    pet.ownerId = dto.ownerId;

    return this.petsRepo.save(pet);
  }

  async updatePatch(id: string, dto: UpdatePetPatchDto) {
    const pet = await this.findOne(id);
    if (dto.ownerId && dto.ownerId !== pet.ownerId) {
      const owner = await this.ownersRepo.findOne({ where: { id: dto.ownerId } });
      if (!owner) throw new NotFoundException('Owner not found');
    }

    Object.assign(pet, dto);
    return this.petsRepo.save(pet);
  }

  async remove(id: string) {
    const pet = await this.findOne(id);
    await this.petsRepo.remove(pet);
    return {deleted: true}
  }
}
