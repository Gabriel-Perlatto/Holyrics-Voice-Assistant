import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import * as qrcode from 'qrcode-terminal';
import { AppModule } from './app/app.module';
import { SystemService } from './modules/system/services/system.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const systemService = app.get(SystemService);
  const port = systemService.getPort();

  app.useStaticAssets(join(process.cwd(), 'public'));

  await app.listen(port, '0.0.0.0');

  const localUrl = systemService.getLocalUrl(port);

  Logger.log(
    `Menu do sistema disponível neste link:\n\n${localUrl}`,
    'Bootstrap',
  );
  Logger.log(
    `O QR Code abaixo abre este mesmo link do menu: ${localUrl}`,
    'Bootstrap',
  );

  qrcode.generate(localUrl, { small: true }, (qrCode) => {
    Logger.log(`\n${qrCode}`, 'Bootstrap');
  });
}

void bootstrap();
