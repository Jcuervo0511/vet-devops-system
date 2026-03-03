import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { Owner } from 'src/owners/entities/owner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pet, Owner])],
  controllers: [PetsController],
  providers: [PetsService],
})
export class PetsModule {}
