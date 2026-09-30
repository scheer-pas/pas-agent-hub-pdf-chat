/** One source an answer names. */
export interface AnswerSource {
  /** The text the source is shown with, for example `contract.pdf, page 3`. */
  label: string;
  /** The file name of the document, or `null` when the source names none. */
  documentName: string | null;
  /** The page within the PDF file, starting with 1, or `null` when the source names none. */
  page: number | null;
}

/** An answer split into its text and the sources of its sources line. */
export interface ParsedAnswer {
  /** The answer without its sources line. */
  body: string;
  /** The sources the sources line names, in order. Empty without a sources line. */
  sources: AnswerSource[];
}

/** Matches a sources line, allowing the emphasis marks a model may add. */
const SOURCES_LINE = /^[\s*_]*sources?[\s*_]*:[\s*_]*(.*)$/i;

/**
 * Matches one source: a document name followed by one or more pages, and the
 * full stop a model may end it with.
 */
const SOURCE = /^(.*?)[,\s]*\bpages?\s+(\d[\d\s,–-]*(?:and\s+\d+)?)\s*\.?\s*$/i;

/** Matches each page number or range of pages of a source, such as `3` or `3–5`. */
const PAGE_OR_RANGE = /(\d+)(?:\s*[–-]\s*(\d+))?/g;

/** Largest number of pages one range of a source expands to. */
const MAX_PAGES_PER_RANGE = 100;

/** Separates the sources of a sources line. */
const SOURCE_SEPARATOR = ';';

/**
 * Splits an answer into its text and the sources named in its last line of the
 * form `Sources: contract.pdf, page 3; notes.pdf, page 7`.
 */
export class AnswerSourcesParser {
  /**
   * Parses an answer. A source that names several pages yields one source per
   * page. A source that names only a page refers to the document of the source
   * before it. A source that cannot be read keeps its text and names no
   * document.
   * @param answer The complete answer.
   * @returns The answer text and its sources.
   */
  public parse(answer: string): ParsedAnswer {
    const lines = answer.trimEnd().split('\n');
    const index = this.sourcesLineIndex(lines);
    if (index === -1) {
      return { body: answer.trimEnd(), sources: [] };
    }

    const match = SOURCES_LINE.exec(lines[index]) as RegExpExecArray;
    const body = [...lines.slice(0, index), ...lines.slice(index + 1)]
      .join('\n')
      .trimEnd();
    const segments = match[1]
      .replace(/[*_]+$/, '')
      .split(SOURCE_SEPARATOR)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    const sources: AnswerSource[] = [];
    let previousDocumentName: string | null = null;
    for (const segment of segments) {
      const parsed = this.parseSource(segment, previousDocumentName);
      sources.push(...parsed);
      previousDocumentName = parsed[0]?.documentName ?? previousDocumentName;
    }

    return { body, sources };
  }

  /**
   * Returns the index of the last sources line.
   * @param lines The lines of the answer.
   * @returns The index, or -1 when the answer has no sources line.
   */
  private sourcesLineIndex(lines: string[]): number {
    for (let index = lines.length - 1; index >= 0; index--) {
      if (SOURCES_LINE.test(lines[index])) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Reads one source of a sources line.
   * @param segment The text of the source.
   * @param previousDocumentName The document of the source before it, used
   *   when the source names only a page; `null` when there is none.
   * @returns One source per page it names.
   */
  private parseSource(
    segment: string,
    previousDocumentName: string | null,
  ): AnswerSource[] {
    const match = SOURCE.exec(segment);
    const documentName = match?.[1].trim() || previousDocumentName;
    if (!match || !documentName) {
      return [{ label: segment, documentName: null, page: null }];
    }

    const pages = this.pagesOf(match[2]);
    return pages.map((page) => ({
      label: `${documentName}, page ${page}`,
      documentName,
      page,
    }));
  }

  /**
   * Reads the pages a source names, expanding a range such as `3–5` to every
   * page in it.
   * @param text The pages part of a source, for example `3, 5–7 and 9`.
   * @returns The pages, in the order they are named.
   */
  private pagesOf(text: string): number[] {
    const pages: number[] = [];
    for (const [, first, last] of text.matchAll(PAGE_OR_RANGE)) {
      const from = Number(first);
      const to = last === undefined ? from : Number(last);
      // A reversed or very long range is not expanded; its two ends stay.
      if (to < from || to - from >= MAX_PAGES_PER_RANGE) {
        pages.push(from, to);
        continue;
      }
      for (let page = from; page <= to; page++) {
        pages.push(page);
      }
    }
    return pages;
  }
}
