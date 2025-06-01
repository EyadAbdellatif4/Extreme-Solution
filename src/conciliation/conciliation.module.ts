import { Module } from '@nestjs/common';
import { ConciliationService } from './conciliation.service';
import { ConciliationController } from './conciliation.controller';

@Module({
  controllers: [ConciliationController],
  providers: [ConciliationService],
})
export class ConciliationModule {}
