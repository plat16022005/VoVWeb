import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      message: 'VoVWeb API is running 🚀',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
