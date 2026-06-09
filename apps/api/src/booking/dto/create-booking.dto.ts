import { IsEmail, IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateBookingDto {
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

  @IsIn(['morning', 'afternoon', 'full-day'])
  shift: string;
}
