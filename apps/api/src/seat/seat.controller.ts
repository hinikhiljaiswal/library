import { Controller, Get, Query } from '@nestjs/common';
import { SeatService } from './seat.service';

@Controller('seats')
export class SeatController {
  constructor(private readonly seats: SeatService) {}

  @Get()
  listSeats(@Query('date') date?: string, @Query('shift') shift?: string) {
    return this.seats.listSeats(date, shift);
  }
}
