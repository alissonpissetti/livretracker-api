import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toComteleReceivers } from '../../lib/phone-br';

export type ComteleChannel = 'transactional' | 'marketing';

/**
 * Envio SMS via Comtele — POST /api/v2/send com header auth-key.
 * @see https://docs.comtele.com.br/
 */
@Injectable()
export class ComteleService {
  private readonly logger = new Logger(ComteleService.name);

  constructor(private readonly config: ConfigService) {}

  private getBaseUrl(): string {
    return (
      this.config.get<string>('COMTELE_URL')?.trim() ||
      this.config.get<string>('COMTELE_API_BASE_URL')?.trim() ||
      'https://sms.comtele.com.br'
    );
  }

  private getAuthKey(channel: ComteleChannel): string | undefined {
    const envKey =
      channel === 'marketing' ? 'COMTELE_AUTH_KEY_MKT' : 'COMTELE_AUTH_KEY';
    const key = this.config.get<string>(envKey)?.trim();
    return key || undefined;
  }

  private getSenderId(): number {
    const raw = this.config.get<string>('COMTELE_SENDER_ID')?.trim() ?? '66912';
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 66912;
  }

  isConfigured(channel: ComteleChannel = 'transactional'): boolean {
    return !!this.getAuthKey(channel);
  }

  /** OTP, login e recuperação de senha — chave transacional. */
  async send(receiversNormalized55: string, content: string): Promise<void> {
    return this.sendWithChannel(receiversNormalized55, content, 'transactional');
  }

  /** Campanhas / avisos em massa — chave de marketing. */
  async sendMarketing(
    receiversNormalized55: string,
    content: string,
  ): Promise<void> {
    return this.sendWithChannel(receiversNormalized55, content, 'marketing');
  }

  private async sendWithChannel(
    receiversNormalized55: string,
    content: string,
    channel: ComteleChannel,
  ): Promise<void> {
    const authKey = this.getAuthKey(channel);
    const envName =
      channel === 'marketing' ? 'COMTELE_AUTH_KEY_MKT' : 'COMTELE_AUTH_KEY';

    if (!authKey) {
      throw new ServiceUnavailableException(
        `Envio de SMS não configurado (${envName}).`,
      );
    }

    const base = this.getBaseUrl().replace(/\/$/, '');
    const url = `${base}/api/v2/send`;
    const receivers = toComteleReceivers(receiversNormalized55);
    const body = {
      Sender: this.getSenderId(),
      Receivers: receivers,
      Content: content,
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          'auth-key': authKey,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(`Comtele (${channel}): falha de rede ao enviar SMS`, err);
      throw new BadGatewayException(
        'Não foi possível contatar o serviço de SMS.',
      );
    }

    const text = await response.text().catch(() => '');
    let parsed: { Success?: boolean; Message?: string } | undefined;
    try {
      parsed = JSON.parse(text) as { Success?: boolean; Message?: string };
    } catch {
      parsed = undefined;
    }
    const apiMessage = parsed?.Message?.trim();

    if (response.ok && parsed && parsed.Success === false) {
      this.logger.error(
        `Comtele (${channel}) Success=false: ${apiMessage ?? text}`,
      );
      throw new BadGatewayException(
        apiMessage ?? 'O serviço de SMS recusou o envio.',
      );
    }

    if (!response.ok) {
      this.logger.error(`Comtele (${channel}) HTTP ${response.status}: ${text}`);
      throw new BadGatewayException(
        apiMessage ??
          `O serviço de SMS recusou o envio (código HTTP ${response.status}).`,
      );
    }
  }
}
