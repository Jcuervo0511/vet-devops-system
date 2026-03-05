import { IsEnum, IsOptional, IsString, IsUUID, MinLength, IsDateString } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';


export class UpdateAppointmentPutDto{
    @IsUUID()
    petId: string;

    @IsDateString()
    appointmentDate: string;

    @IsString()
    @MinLength(3)
    reason: string;

    @IsEnum(AppointmentStatus)
    status: AppointmentStatus;
}
