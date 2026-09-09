import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AgentService } from './agent.service';
import {
  extractIncomingMessages,
  WhatsappWebhookPayload,
} from '../whatsapp/whatsapp.types';

@Controller('whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly agentService: AgentService,
  ) {}

  /** Meta's one-time webhook verification handshake */
  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.getOrThrow<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expected) {
      res.status(HttpStatus.OK).send(challenge);
      return;
    }
    res.status(HttpStatus.FORBIDDEN).send('Verification failed');
  }

  /** Inbound message delivery */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async receive(@Body() payload: WhatsappWebhookPayload): Promise<{ status: string }> {
    const messages = extractIncomingMessages(payload);
    for (const message of messages) {
      // Never log message.text here — see RedactingLogger / logging policy.
      this.agentService.handleIncomingMessage(message).catch((error) => {
        this.logger.error(`Failed to process inbound WhatsApp message: ${error.message}`);
      });
    }
    // Always 200 quickly — Meta retries aggressively on non-200 responses,
    // and processing (LLM call, DB writes) happens asynchronously above.
    return { status: 'received' };
  }
}
