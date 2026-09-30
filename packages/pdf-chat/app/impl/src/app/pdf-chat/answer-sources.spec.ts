import { AnswerSourcesParser } from './answer-sources';

describe('AnswerSourcesParser', () => {
  const parser = new AnswerSourcesParser();

  it('splits the text from the sources of the last line', () => {
    expect(
      parser.parse(
        'The notice period is three months.\nSources: contract.pdf, page 3; notes.pdf, page 7',
      ),
    ).toEqual({
      body: 'The notice period is three months.',
      sources: [
        {
          label: 'contract.pdf, page 3',
          documentName: 'contract.pdf',
          page: 3,
        },
        { label: 'notes.pdf, page 7', documentName: 'notes.pdf', page: 7 },
      ],
    });
  });

  it('returns the answer unchanged without a sources line', () => {
    expect(
      parser.parse('The documents do not contain this information.\n'),
    ).toEqual({
      body: 'The documents do not contain this information.',
      sources: [],
    });
  });

  it('yields one source per page when a source names several pages', () => {
    expect(
      parser.parse('Text\nSources: contract.pdf, pages 3, 5 and 8').sources,
    ).toEqual([
      { label: 'contract.pdf, page 3', documentName: 'contract.pdf', page: 3 },
      { label: 'contract.pdf, page 5', documentName: 'contract.pdf', page: 5 },
      { label: 'contract.pdf, page 8', documentName: 'contract.pdf', page: 8 },
    ]);
  });

  it('accepts emphasis marks around the sources label', () => {
    expect(
      parser.parse('Text\n**Sources:** notes.pdf, page 2').sources,
    ).toEqual([
      { label: 'notes.pdf, page 2', documentName: 'notes.pdf', page: 2 },
    ]);
  });

  it('reads a source that ends with a full stop', () => {
    expect(
      parser.parse('Text\nSources: From Village to City.pdf, page 1.').sources,
    ).toEqual([
      {
        label: 'From Village to City.pdf, page 1',
        documentName: 'From Village to City.pdf',
        page: 1,
      },
    ]);
  });

  it('reads a source that names only a page as a page of the document before it', () => {
    expect(
      parser.parse(
        'Text\nSources: Agreement Sample.pdf, page 1; page 2; page 3; page 4; page 5; page 6; page 7.',
      ).sources,
    ).toEqual(
      [1, 2, 3, 4, 5, 6, 7].map((page) => ({
        label: `Agreement Sample.pdf, page ${page}`,
        documentName: 'Agreement Sample.pdf',
        page,
      })),
    );
  });

  it('takes the nearest document before a source that names only a page', () => {
    expect(
      parser.parse(
        'Text\nSources: contract.pdf, page 1; page 2; notes.pdf, page 7; page 8',
      ).sources,
    ).toEqual([
      { label: 'contract.pdf, page 1', documentName: 'contract.pdf', page: 1 },
      { label: 'contract.pdf, page 2', documentName: 'contract.pdf', page: 2 },
      { label: 'notes.pdf, page 7', documentName: 'notes.pdf', page: 7 },
      { label: 'notes.pdf, page 8', documentName: 'notes.pdf', page: 8 },
    ]);
  });

  it('names every page of a range', () => {
    expect(
      parser.parse(
        'Text\nSources: contract.pdf, pages 3–5; notes.pdf, pages 7-8',
      ).sources,
    ).toEqual([
      { label: 'contract.pdf, page 3', documentName: 'contract.pdf', page: 3 },
      { label: 'contract.pdf, page 4', documentName: 'contract.pdf', page: 4 },
      { label: 'contract.pdf, page 5', documentName: 'contract.pdf', page: 5 },
      { label: 'notes.pdf, page 7', documentName: 'notes.pdf', page: 7 },
      { label: 'notes.pdf, page 8', documentName: 'notes.pdf', page: 8 },
    ]);
  });

  it('keeps only the ends of a reversed or very long range', () => {
    expect(
      parser
        .parse('Text\nSources: a.pdf, pages 9–2; b.pdf, pages 1–500')
        .sources.map((source) => source.page),
    ).toEqual([9, 2, 1, 500]);
  });

  it('keeps a source it cannot read as text without a document', () => {
    expect(parser.parse('Text\nSources: page 4; the appendix').sources).toEqual(
      [
        { label: 'page 4', documentName: null, page: null },
        { label: 'the appendix', documentName: null, page: null },
      ],
    );
  });

  it('keeps file names that contain commas', () => {
    expect(
      parser.parse('Text\nSources: offer, final.pdf, page 1').sources,
    ).toEqual([
      {
        label: 'offer, final.pdf, page 1',
        documentName: 'offer, final.pdf',
        page: 1,
      },
    ]);
  });
});
