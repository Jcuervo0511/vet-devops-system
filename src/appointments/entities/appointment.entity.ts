import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'pet_id' })
    petId: string;

    @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pet_id' })
    pet: Pet;

    @Column({ type: 'timestamp', name: 'appointment_date' })
    appointmentDate: Date;

    @Column()
    reason: string;

    @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
    status: AppointmentStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}