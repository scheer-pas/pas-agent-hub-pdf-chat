import { PdfChatConversation } from './pdf-chat-conversation';

describe('PdfChatConversation', () => {
  const conversation = new PdfChatConversation();

  it('formats the messages oldest first, one per line', () => {
    const transcript = conversation.format([
      { role: 'user', text: 'What is this about?' },
      { role: 'assistant', text: 'It is about cats.' },
    ]);

    expect(transcript).toBe(
      'User: What is this about?\nAssistant: It is about cats.',
    );
  });

  it('leaves out messages whose role it does not know', () => {
    const transcript = conversation.format([
      { role: 'system', text: 'ignored' },
      { role: 'user', text: 'Hello' },
    ]);

    expect(transcript).toBe('User: Hello');
  });

  it('does not treat inherited object keys as roles', () => {
    expect(conversation.format([{ role: 'toString', text: 'x' }])).toBe(
      '(none)',
    );
  });

  it('returns (none) when there are no messages', () => {
    expect(conversation.format()).toBe('(none)');
    expect(conversation.format([])).toBe('(none)');
  });
});
