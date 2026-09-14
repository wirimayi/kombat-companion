import { CHARACTERS, GEARS } from './game';

export type OCRDraft = {
  kind: 'character' | 'gear' | 'kameo'; id: string | null; name: string;
  level: number | null; fusion: number | null; ascension: number | null; raw: string;
};
type Kind = OCRDraft['kind'];
const normalize = (value: string) => value.normalize('NFKD').replace(/[’‘]/g, "'").toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const romans = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function labeled(text: string, label: string, max: number, min = 0): number | null {
  const matches = [...text.matchAll(new RegExp(`\\b(?:${label})\\s*[:=]?\\s*(\\d+|[IVX]+)\\b(?![.,]\\d)`, 'gi'))];
  const values = matches.map(match => /^\d+$/.test(match[1]) ? Number(match[1]) : romans.indexOf(match[1].toUpperCase()));
  if (!values.length || values.some(value => value < min || value > max) || new Set(values).size !== 1) return null;
  return values[0];
}

/** Text-only OCR cannot safely associate grid statistics with individual tiles. */
export function parseScreenshotText(text: string, kind: Kind | 'auto'): OCRDraft[] {
  if (kind === 'auto') {
    const found = [...parseScreenshotText(text, 'character'), ...parseScreenshotText(text, 'gear')].filter(d => d.id);
    // Mixed screenshots have no reliable text-only association between stats and cards.
    if (found.length > 1) return found.map(d => ({...d, level:null, fusion:null, ascension:null}));
    return found.length ? found : parseScreenshotText(text, 'character');
  }
  const normalized = ` ${normalize(text)} `;
  const catalog = kind === 'gear' ? GEARS : CHARACTERS;
  const matches = catalog.filter(card => normalized.includes(` ${normalize(card.name)} `));
  const unique = [...new Map(matches.map(card => [card.id, card])).values()];
  const single = unique.length === 1;
  const stats = {
    level: single && kind !== 'gear' ? labeled(text, 'level|lvl', 60, 1) : null,
    fusion: single ? labeled(text, 'fusion', 10) : null,
    ascension: single && kind === 'character' ? labeled(text, 'ascension', 10) : null,
  };
  if (!unique.length) return [{ kind, id: null, name: '', level: null, fusion: null, ascension: null, raw: text }];
  return unique.map(card => ({ kind, id: card.id, name: card.name, ...stats, raw: text }));
}

let active = false;
export async function recognizeScreenshot(
  file: File, kind: Kind | 'auto', onProgress: (progress: number, status: string) => void,
): Promise<{ text: string; drafts: OCRDraft[] }> {
  if (active) throw new Error('Please wait for the current screenshot to finish.');
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG or WebP screenshot.');
  if (!file.size || file.size > 15 * 1024 * 1024) throw new Error('Choose a screenshot smaller than 15 MB.');
  active = true;
  let worker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | undefined;
  const url = URL.createObjectURL(file);
  try {
    onProgress(0, 'Checking screenshot');
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch { throw new Error('This file could not be read as an image. Try another screenshot.'); }
    if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 24000000) throw new Error('Use a screenshot with fewer than 24 million pixels.');
    const { createWorker, PSM } = await import('tesseract.js');
    const base = import.meta.env.BASE_URL;
    worker = await createWorker('eng', 1, {
      workerPath: `${base}ocr/worker.min.js`, corePath: `${base}ocr/core`, langPath: `${base}ocr/lang`,
      logger: message => onProgress(Math.max(0, Math.min(1, message.progress || 0)), message.status),
    });
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const result = await worker.recognize(img);
    onProgress(1, 'Ready for review');
    return { text: result.data.text, drafts: parseScreenshotText(result.data.text, kind) };
  } finally {
    try { await worker?.terminate(); } finally { URL.revokeObjectURL(url); active = false; }
  }
}
