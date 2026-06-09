import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SEATS } from './seat.layout';
import { Seat } from './seat.types';
import { SeatPricing, SeatPricingDocument } from './seat-pricing.schema';

@Injectable()
export class SeatPricingService {
  constructor(@InjectModel(SeatPricing.name) private readonly pricingModel: Model<SeatPricingDocument>) {}

  async listSeatsWithPrices(): Promise<Seat[]> {
    const overrides = await this.pricingModel.find().lean();
    const priceMap = new Map(overrides.map((item) => [item.seatId, item.price]));

    return SEATS.map((seat) => ({
      ...seat,
      price: priceMap.get(seat.id) ?? seat.price,
    }));
  }

  async getSeatWithPrice(seatId: string): Promise<Seat> {
    const seat = SEATS.find((item) => item.id === seatId);
    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    const override = await this.pricingModel.findOne({ seatId }).lean();
    return {
      ...seat,
      price: override?.price ?? seat.price,
    };
  }

  async updateSeatPrice(seatId: string, price: number) {
    await this.getSeatWithPrice(seatId);

    return this.pricingModel
      .findOneAndUpdate(
        { seatId },
        { seatId, price },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();
  }

  async resetSeatPrice(seatId: string) {
    await this.getSeatWithPrice(seatId);
    await this.pricingModel.deleteOne({ seatId });

    return this.getSeatWithPrice(seatId);
  }

  async resetAllPrices() {
    const result = await this.pricingModel.deleteMany({});
    return { reset: result.deletedCount };
  }
}
