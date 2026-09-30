import { pdfChatRequestSchema } from './pdf-chat-request';

describe('pdfChatRequestSchema', () => {
  const document = { name: 'contract.pdf', data: 'JVBERi0=' };

  it('accepts a question about one document without history', () => {
    expect(
      pdfChatRequestSchema.safeParse({
        question: 'What is the notice period?',
        documents: [document],
      }).success,
    ).toBe(true);
  });

  it('accepts up to 5 documents and earlier messages of any role', () => {
    const result = pdfChatRequestSchema.safeParse({
      question: 'And the renewal?',
      documents: Array.from({ length: 5 }, (_, index) => ({
        ...document,
        name: `${index}.pdf`,
      })),
      history: [
        { role: 'user', text: 'What is the notice period?' },
        { role: 'assistant', text: 'Three months.' },
        { role: 'reviewer', text: 'A role a later version may add.' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('removes fields it does not know', () => {
    const result = pdfChatRequestSchema.safeParse({
      question: 'Hi',
      documents: [document],
      extra: true,
    });

    expect(result.success && 'extra' in result.data).toBe(false);
  });

  it.each([
    ['an empty question', { question: '', documents: [document] }],
    ['a missing question', { documents: [document] }],
    ['no document', { question: 'Hi', documents: [] }],
    [
      '6 documents',
      {
        question: 'Hi',
        documents: Array.from({ length: 6 }, () => document),
      },
    ],
    [
      'a document without a name',
      { question: 'Hi', documents: [{ ...document, name: '' }] },
    ],
    [
      'a message without a role',
      {
        question: 'Hi',
        documents: [document],
        history: [{ role: '', text: 'Hello' }],
      },
    ],
  ])('rejects %s', (_, request) => {
    expect(pdfChatRequestSchema.safeParse(request).success).toBe(false);
  });
});
