import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UpdateSeatPriceDto } from '../seat/dto/update-seat-price.dto';
import { SeatPricingService } from '../seat/seat-pricing.service';
import { AdminGuard } from './admin.guard';

@Controller('admin/seats')
@UseGuards(AdminGuard)
export class AdminSeatPricingController {
  constructor(private readonly pricing: SeatPricingService) {}

  @Get()
  listSeats() {
    return this.pricing.listSeatsWithPrices();
  }

  @Patch(':seatId')
  updateSeatPrice(@Param('seatId') seatId: string, @Body() dto: UpdateSeatPriceDto) {
    return this.pricing.updateSeatPrice(seatId.toUpperCase(), dto.price);
  }

  @Delete(':seatId')
  resetSeatPrice(@Param('seatId') seatId: string) {
    return this.pricing.resetSeatPrice(seatId.toUpperCase());
  }

  @Post('reset')
  resetAllPrices() {
    return this.pricing.resetAllPrices();
  }
}
