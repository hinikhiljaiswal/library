import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SEATS } from '../seat/seat.layout';

export const activeStatuses = ['pending', 'paid'] as const;
export const bookingStatuses = ['pending', 'paid', 'expired', 'cancelled'] as const;
export const bookingShifts = ['morning', 'afternoon', 'full-day'] as const;

export type BookingShift = (typeof bookingShifts)[number];

const shiftPrices: Record<BookingShift, number> = {
  morning: 1,
  afternoon: 1,
  'full-day': 1.8,
};

const overlaps: Record<BookingShift, BookingShift[]> = {
  morning: ['morning', 'full-day'],
  afternoon: ['afternoon', 'full-day'],
  'full-day': ['morning', 'afternoon', 'full-day'],
};

export function assertSeat(seatId: string) {
  const seat = SEATS.find((item) => item.id === seatId);
  if (!seat) {
    throw new NotFoundException('Seat not found');
  }

  return seat;
}

export function assertShift(shift: string): asserts shift is BookingShift {
  if (!bookingShifts.includes(shift as BookingShift)) {
    throw new BadRequestException('Invalid shift');
  }
}

export function calculateAmount(price: number, shift: string) {
  assertShift(shift);

  return Math.round(price * shiftPrices[shift]);
}

export function overlappingShifts(shift: string) {
  assertShift(shift);
  return overlaps[shift];
}
