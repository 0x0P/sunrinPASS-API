import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QRCodeUtil } from './utils/qr-code.util';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [QRCodeUtil],
  exports: [QRCodeUtil],
})
export class CommonModule {}
