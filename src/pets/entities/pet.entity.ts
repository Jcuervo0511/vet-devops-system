import { Appointment } from "../../appointments/entities/appointment.entity";
import { Owner } from "../../owners/entities/owner.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    @OneToMany(() => Appointment, (appointment) => appointment.pet)
    appointments: Appointment[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;


}
