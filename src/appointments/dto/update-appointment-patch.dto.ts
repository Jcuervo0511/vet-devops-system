import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength, IsDateString } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';


export class UpdateAppointmentPatchDto extends PartialType(CreateAppointmentDto) {
    @IsOptional()
    @IsUUID()
    petId?: string;

    @IsOptional()
    @IsDateString()
    appointmentDate?: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    reason?: string;

    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;
}
