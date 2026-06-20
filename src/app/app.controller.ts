import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'node:path';

@Controller()
export class AppController {
  private readonly pagesDirectory = join(process.cwd(), 'public', 'pages');

  @Get()
  serveHub(@Res() response: Response): void {
    response.sendFile('index.html', { root: this.pagesDirectory });
  }

  @Get('preacher')
  servePreacher(@Res() response: Response): void {
    response.sendFile('preacher.html', { root: this.pagesDirectory });
  }

  @Get('worship')
  serveWorship(@Res() response: Response): void {
    response.sendFile('worship.html', { root: this.pagesDirectory });
  }

  @Get('settings')
  serveSettings(@Res() response: Response): void {
    response.sendFile('settings.html', { root: this.pagesDirectory });
  }
}
