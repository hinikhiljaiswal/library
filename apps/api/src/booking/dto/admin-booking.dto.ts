import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { bookingStatuses, bookingShifts } from '../booking-rules';

export class AdminCreateBookingDto {
  @IsString()
  @IsNotEmpty()
  seatId: string;

  @IsString()
  @IsNotEmpty()
  studentName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^[0-9+\-\s]{8,18}$/)
  phone: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsIn(bookingShifts)
  shift: string;

  @IsIn(bookingStatuses)
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdminUpdateBookingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  seatId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  studentName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s]{8,18}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @IsIn(bookingShifts)
  shift?: string;

  @IsOptional()
  @IsIn(bookingStatuses)
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
