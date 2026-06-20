import { Module } from '@nestjs/common';
import { SystemModule } from '../modules/system/system.module';
import { AppController } from './app.controller';

@Module({
  imports: [SystemModule],
  controllers: [AppController],
})
export class AppModule {}
