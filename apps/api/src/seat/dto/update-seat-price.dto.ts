import { IsInt, Max, Min } from 'class-validator';

export class UpdateSeatPriceDto {
  @IsInt()
  @Min(1)
  @Max(100000)
  price: number;
}
