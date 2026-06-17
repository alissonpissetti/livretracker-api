import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeBrCellphone } from '../lib/phone-br';
import { ComteleService } from '../plugins/comtele/comtele.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly comtele: ComteleService,
  ) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const normalized = normalizeBrCellphone(phone);
    if (!normalized) {
      throw new BadRequestException('Telefone inválido para envio de SMS');
    }

    const message = `Seu código LIVRE TRACKER: ${code}. Não compartilhe. Válido por 10 minutos.`;

    if (this.comtele.isConfigured()) {
      await this.comtele.send(normalized, message);
      this.logger.log(`SMS OTP enviado via Comtele para ****${normalized.slice(-4)}`);
      return;
    }

    const isDev = this.config.get<string>('NODE_ENV', 'development') !== 'production';
    if (isDev) {
      this.logger.warn(
        `[DEV] COMTELE_AUTH_KEY ausente. Código para ${phone}: ${code}`,
      );
      return;
    }

    throw new ServiceUnavailableException(
      'Envio de SMS indisponível. Configure COMTELE_AUTH_KEY.',
    );
  }
}
