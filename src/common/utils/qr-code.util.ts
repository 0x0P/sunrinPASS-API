import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { Pass } from '../../passes/entities/pass.entity';

@Injectable()
export class QRCodeUtil {
  constructor(private readonly configService: ConfigService) {}

  public generateHash(id: string): string {
    const secret = this.configService.get<string>('QR_SECRET');
    if (!secret) {
      throw new Error('QR_SECRET 없음');
    }
    return crypto
      .createHmac('sha256', secret)
      .update(id)
      .digest('hex')
      .substring(0, 8);
  }

  async generateQRCode(pass: Pass): Promise<{ qrCode: string; hash: string }> {
    const hash = this.generateHash(pass.id);
    const qrData = {
      id: pass.id,
      hash: hash,
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 4,
    });

    return { qrCode, hash };
  }

  verifyQRCode(qrData: string, passId: string): boolean {
    try {
      const data = JSON.parse(qrData);
      if (data.id !== passId) {
        return false;
      }
      const computedHash = this.generateHash(passId);
      return computedHash === data.hash;
    } catch {
      return false;
    }
  }
}
