export type SeatStatus = 'available' | 'pending' | 'booked';

export interface Seat {
  id: string;
  row: number;
  column: number;
  block: string;
  price: number;
}

export interface SeatWithStatus extends Seat {
  status: SeatStatus;
}
