import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength, IsDateString } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';


export class UpdateAppointmentPutDto extends PartialType(CreateAppointmentDto) {
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
