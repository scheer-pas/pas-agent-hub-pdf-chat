import { AgentModule } from '@pas/agent-api';
import { PasServiceNestjsModule } from '@pas/service-nestjs-api';
import { PdfChatAgent } from './pdf-chat.agent';

/**
 * PDF chat: answers questions about an uploaded PDF document.
 */
@PasServiceNestjsModule({})
@AgentModule({
  agents: [PdfChatAgent],
})
export class PdfChatModule {}
