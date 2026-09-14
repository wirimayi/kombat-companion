import { describe, expect, it } from 'vitest';
import { CHARACTERS, GEARS } from './game';
import { parseScreenshotText } from './ocr';

describe('screenshot review drafts', () => {
  it('matches normalized full names and labeled detail values', () => {
    const card = CHARACTERS[0];
    const [draft] = parseScreenshotText(`${card.name.toUpperCase()}\nLevel: 50\nFusion: VIII`, 'character');
    expect(draft).toMatchObject({ id: card.id, level: 50, fusion: 8, ascension: null });
  });
  it('does not infer bare Roman numerals or tile numbers', () => {
    const [draft] = parseScreenshotText(`${CHARACTERS[0].name}\nX\n60\n123456`, 'character');
    expect(draft).toMatchObject({ level: null, fusion: null, ascension: null });
  });
  it('deduplicates repeated recognized names', () => {
    expect(parseScreenshotText(`${GEARS[0].name}\n${GEARS[0].name}`, 'gear')).toHaveLength(1);
  });
  it('does not assign one tile’s labeled stats to a multi-card grid', () => {
    const drafts = parseScreenshotText(`${CHARACTERS[0].name}\nLevel 50\nFusion X\n${CHARACTERS[1].name}`, 'character');
    expect(drafts.length).toBeGreaterThanOrEqual(2);
    expect(drafts.every(draft => draft.level === null && draft.fusion === null)).toBe(true);
  });
  it('rejects contradictory and out-of-range labels', () => {
    const [draft] = parseScreenshotText(`${CHARACTERS[0].name}\nLevel 50\nLevel 60\nFusion 99`, 'character');
    expect(draft.level).toBeNull(); expect(draft.fusion).toBeNull();
  });
  it('keeps unknown text for manual identification without fabricating a card', () => {
    const [draft] = parseScreenshotText('Unrecognized card\nFusion V', 'character');
    expect(draft).toMatchObject({ id: null, name: '', fusion: null, raw: 'Unrecognized card\nFusion V' });
  });
  it('preserves kameo type and never gives gear character levels', () => {
    expect(parseScreenshotText(CHARACTERS[0].name, 'kameo')[0].kind).toBe('kameo');
    expect(parseScreenshotText(`${GEARS[0].name}\nLevel 50\nFusion 0`, 'gear')[0]).toMatchObject({ level: null, fusion: 0 });
  });
});


describe('automatic screenshot type', () => {
  it('recognizes a gear screenshot without choosing an equipment tab', () => {
    expect(parseScreenshotText(`${GEARS[0].name}\nFusion VIII`, 'auto')[0]).toMatchObject({kind:'gear', id:GEARS[0].id, fusion:8});
  });
  it('recognizes a fighter screenshot without choosing a fighter tab', () => {
    expect(parseScreenshotText(`${CHARACTERS[0].name}\nLevel 50\nFusion V`, 'auto')[0]).toMatchObject({kind:'character', id:CHARACTERS[0].id, level:50, fusion:5});
  });
  it('does not transfer stats between mixed card types', () => {
    const result=parseScreenshotText(`${CHARACTERS[0].name}\nLevel 50\nFusion V\n${GEARS[0].name}`, 'auto');
    expect(result).toHaveLength(2);
    expect(result.every(d=>d.level===null && d.fusion===null)).toBe(true);
  });
});
