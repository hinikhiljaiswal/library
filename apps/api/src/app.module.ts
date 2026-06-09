import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from './admin/admin.module';
import { BookingModule } from './booking/booking.module';
import { getMongoDbUri } from './config/mongodb-uri';
import { PaymentModule } from './payment/payment.module';
import { SeatModule } from './seat/seat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: getMongoDbUri(config.get<string>('MONGODB_URI')),
      }),
    }),
    BookingModule,
    AdminModule,
    PaymentModule,
    SeatModule,
  ],
})
export class AppModule {}
