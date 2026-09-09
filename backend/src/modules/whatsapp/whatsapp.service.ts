import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin wrapper over the Meta WhatsApp Cloud API. Direct integration, no BSP
 * layer, per the Phase 1 decision to keep pilot infra simple.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  async sendTextMessage(to: string, body: string): Promise<void> {
    const apiVersion = this.config.get<string>('WHATSAPP_API_VERSION', 'v21.0');
    const phoneNumberId = this.config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    const token = this.config.getOrThrow<string>('WHATSAPP_TOKEN');
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    if (!response.ok) {
      // Never log the WHATSAPP_TOKEN or the full message body here.
      const status = response.status;
      this.logger.error(`WhatsApp send failed with status ${status} for recipient ${to}`);
      throw new Error(`WhatsApp API responded with status ${status}`);
    }
  }
}
