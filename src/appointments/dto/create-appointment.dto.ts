import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class CreateAppointmentDto {

    @IsUUID()
    petId: string;

    @IsDateString()
    appointmentDate: string;

    @IsString()
    @MinLength(3)
    reason: string;

    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;
}