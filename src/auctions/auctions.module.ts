import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { ConfigModule } from '@nestjs/config';
import { StripeConfig } from './config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ load: [StripeConfig] }), PrismaModule],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}
