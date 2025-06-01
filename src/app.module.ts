import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConciliationModule } from './conciliation/conciliation.module';

@Module({
  imports: [ConciliationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
