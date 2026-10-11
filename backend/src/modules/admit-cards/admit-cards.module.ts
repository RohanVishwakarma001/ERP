import { Module } from '@nestjs/common';
import { AdmitCardsController } from './admit-cards.controller';
import { AdmitCardsService } from './admit-cards.service';

@Module({
  controllers: [AdmitCardsController],
  providers: [AdmitCardsService],
})
export class AdmitCardsModule {}
