import { Module } from '@nestjs/common';
import { SystemController } from './controllers/system.controller';
import { networkInterfacesProvider } from './providers/network-interfaces.provider';
import { SystemService } from './services/system.service';

@Module({
  controllers: [SystemController],
  providers: [networkInterfacesProvider, SystemService],
  exports: [SystemService],
})
export class SystemModule {}
