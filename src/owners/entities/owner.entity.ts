import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

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

}
