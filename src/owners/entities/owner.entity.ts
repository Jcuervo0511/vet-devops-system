import { Pet } from "src/pets/entities/pet.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('owners')
export class Owner {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'full_name' })
    fullName: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    phone_number: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => Pet, (pet) => pet.owner)
    pets: Pet[];

}
