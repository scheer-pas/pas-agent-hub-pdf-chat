import { AgentModule } from '@pas/agent-api';
import { PasServiceNestjsModule } from '@pas/service-nestjs-api';
import { PdfChatAgent } from './pdf-chat.agent';
import { PdfChatController } from './pdf-chat.controller';
import { PdfChatConversation } from './pdf-chat-conversation';
import { PdfChatService } from './pdf-chat.service';

/**
 * PDF chat: answers questions about uploaded PDF documents.
 */
@PasServiceNestjsModule({
  controllers: [PdfChatController],
  providers: [PdfChatService, PdfChatConversation],
})
@AgentModule({
  agents: [PdfChatAgent],
})
export class PdfChatModule {}
