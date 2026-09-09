/** Minimal shape of a WhatsApp Cloud API webhook payload — only the fields this app reads. */
export interface WhatsappWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: Array<{
          from?: string;
          id?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
}

export interface IncomingWhatsappMessage {
  phoneNumberId: string;
  from: string;
  text: string;
  whatsappMessageId: string;
}

export function extractIncomingMessages(
  payload: WhatsappWebhookPayload,
): IncomingWhatsappMessage[] {
  const results: IncomingWhatsappMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const phoneNumberId = change.value?.metadata?.phone_number_id;
      if (!phoneNumberId) continue;
      for (const message of change.value?.messages ?? []) {
        if (message.type !== 'text' || !message.text?.body || !message.from) continue;
        results.push({
          phoneNumberId,
          from: message.from,
          text: message.text.body,
          whatsappMessageId: message.id ?? '',
        });
      }
    }
  }
  return results;
}
