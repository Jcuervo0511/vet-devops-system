import { Owner } from "src/owners/entities/owner.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('pets')
export class Pet {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    species: string;

    @Column({ nullable: true })
    breed?: string;

    @Column({ type: 'date', nullable: true, name: 'birth_date' })
    birthDate?: string;

    @Column({ name: 'owner_id' })
    ownerId: string;

    @ManyToOne(() => Owner, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;


}
