import { Seat } from './seat.types';

const seats: Seat[] = [];
let nextSeatNumber = 1;
const unavailablePositions = new Set([
  '10:1',
  '10:2',
  '10:3',
  '2:2',
  '2:3',
]);
const rowsFromBack = [11, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

function addSeat(row: number, column: number, block: string, price: number) {
  if (unavailablePositions.has(`${row}:${column}`)) {
    return;
  }

  seats.push({
    id: String(nextSeatNumber),
    row,
    column,
    block,
    price,
  });
  nextSeatNumber += 1;
}

function getSeatColumns(row: number) {
  if (row === 11) {
    return Array.from({ length: 8 }, (_, index) => ({ column: 8 - index, block: 'Connected', price: 179 }));
  }

  if (row === 0) {
    return Array.from({ length: 5 }, (_, index) => ({ column: index + 1, block: 'Extra', price: 149 }));
  }

  return [
    ...Array.from({ length: 2 }, (_, index) => ({ column: index + 7, block: 'B', price: 149 })),
    ...Array.from({ length: 5 }, (_, index) => ({ column: index + 1, block: 'A', price: 149 })),
  ];
}

rowsFromBack.forEach((row, index) => {
  const columns = getSeatColumns(row).filter(({ column }) => !unavailablePositions.has(`${row}:${column}`));
  const isOddRowFromBack = (index + 1) % 2 === 1;
  const orderedColumns = isOddRowFromBack ? columns : [...columns].reverse();

  orderedColumns.forEach(({ column, block, price }) => addSeat(row, column, block, price));
});

export const SEATS = seats;
