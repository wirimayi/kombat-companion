import type { Collection } from './game';

const MAX_BYTES = 2_000_000;
const DB_NAME = 'kombat-companion';
const STORE = 'collection';
const KEY = 'current';

function fail(message: string): never { throw new Error(`Invalid collection: ${message}`); }
function object(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${name} must be an object.`);
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[], name: string) {
  if (Object.keys(value).some(key => !allowed.includes(key))) fail(`${name} contains unsupported fields.`);
}
function integer(value: unknown, min: number, max: number, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) fail(`${name} must be an integer from ${min} to ${max}.`);
  return value;
}
function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') fail('Availability must be true or false.');
  return value;
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 160 || /[\u0000-\u001f\u007f]/.test(value)) fail('Card ID is missing or invalid.');
  return value;
}
function cards<T extends {id: string}>(value: unknown, decode: (value: unknown) => T): T[] {
  if (!Array.isArray(value) || value.length > 3000) fail('Card list is missing or too large.');
  const result = value.map(decode);
  if (new Set(result.map(card => card.id)).size !== result.length) fail('Duplicate card IDs.');
  return result;
}

export function validateCollection(value: unknown): Collection {
  const c = object(value, 'Collection');
  keys(c, ['characters', 'gear', 'kameos', 'talents', 'unknownCards'], 'Collection');
  if (typeof c.talents !== 'string' || c.talents.length > 10000) fail('Talents must be text of at most 10000 characters.');
  if (!Array.isArray(c.unknownCards) || c.unknownCards.length > 3000) fail('Unknown cards list is invalid.');
  const unknownCards = c.unknownCards.map(id);
  if (new Set(unknownCards).size !== unknownCards.length) fail('Duplicate unknown card IDs.');
  return {
    characters: cards(c.characters, value => {
      const row = object(value, 'Character');
      keys(row, ['id','level','fusion','ascension','available','passive','sp1','sp2'], 'Character');
      return {id:id(row.id), level:integer(row.level,1,60,'Level'), fusion:integer(row.fusion,0,10,'Fusion'), ascension:integer(row.ascension,0,10,'Ascension'), available:bool(row.available),
        ...(row.passive === undefined ? {} : {passive:integer(row.passive,1,3,'Passive')}),
        ...(row.sp1 === undefined ? {} : {sp1:integer(row.sp1,1,10,'Special 1')}),
        ...(row.sp2 === undefined ? {} : {sp2:integer(row.sp2,1,10,'Special 2')})};
    }),
    gear: cards(c.gear, value => {
      const row = object(value, 'Gear'); keys(row,['id','fusion'],'Gear');
      return {id:id(row.id),fusion:integer(row.fusion,0,10,'Gear fusion')};
    }),
    kameos: cards(c.kameos, value => {
      const row = object(value, 'Kameo'); keys(row,['id','level','fusion','available','attack1Effect','attack2Effect'],'Kameo');
      const effects=['Damage','Stun','Freeze','Power Drain','Snare','Shield','Regeneration','Dispel','Cripple','Death Mark','Fire','Poison','Bleed'];
      for(const key of ['attack1Effect','attack2Effect'])if(row[key]!==undefined&&(typeof row[key]!=='string'||!effects.includes(row[key] as string)))fail('Invalid Kameo effect.');
      return {id:id(row.id),level:integer(row.level,1,60,'Kameo level'),fusion:integer(row.fusion,0,10,'Kameo fusion'),available:bool(row.available),...(row.attack1Effect===undefined?{}:{attack1Effect:row.attack1Effect as string}),...(row.attack2Effect===undefined?{}:{attack2Effect:row.attack2Effect as string})};
    }),
    talents:c.talents,
    unknownCards,
  };
}

export function exportBackup(collection: Collection): string {
  return JSON.stringify({version:1,savedAt:new Date().toISOString(),collection:validateCollection(collection)},null,2);
}

export function parseBackup(text: string): Collection {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BYTES) fail('Backup exceeds 2 MB.');
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { fail('Backup is not valid JSON.'); }
  const envelope = object(parsed,'Backup');
  keys(envelope,['version','savedAt','collection'],'Backup');
  if (envelope.version !== 1) fail('Unsupported backup version.');
  if (typeof envelope.savedAt !== 'string' || envelope.savedAt.length > 64 || !Number.isFinite(Date.parse(envelope.savedAt))) fail('Backup date is invalid.');
  return validateCollection(envelope.collection);
}

export function mergeCollections(current: Collection, incoming: Collection, overwrite: boolean): Collection {
  const a = validateCollection(current), b = validateCollection(incoming);
  const merge = <T extends {id:string}>(oldRows:T[],newRows:T[]):T[] => {
    const rows = new Map(oldRows.map(row => [row.id,row]));
    for (const row of newRows) if (overwrite || !rows.has(row.id)) rows.set(row.id,row);
    return [...rows.values()];
  };
  return validateCollection({characters:merge(a.characters,b.characters),gear:merge(a.gear,b.gear),kameos:merge(a.kameos,b.kameos),talents:overwrite ? b.talents : a.talents,unknownCards:[...new Set([...a.unknownCards,...b.unknownCards])]});
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve,reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Browser storage is unavailable. Export a backup before leaving.')); return; }
    const request = indexedDB.open(DB_NAME,1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onerror = () => reject(request.error ?? new Error('Cannot open browser storage.'));
    request.onblocked = () => reject(new Error('Browser storage is blocked. Close other app tabs and retry.'));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function loadCollection(): Promise<Collection|null> {
  const db = await openDatabase();
  try {
    const value = await new Promise<unknown>((resolve,reject) => {
      const tx = db.transaction(STORE,'readonly');
      const request = tx.objectStore(STORE).get(KEY);
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error ?? new Error('Could not read collection.'));
      tx.onerror = () => reject(tx.error ?? new Error('Could not read collection.'));
    });
    return value === undefined ? null : validateCollection(value);
  } finally { db.close(); }
}

export async function saveCollection(collection: Collection): Promise<void> {
  const valid = validateCollection(collection);
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve,reject) => {
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(valid,KEY);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error('Collection was not saved. Export a backup.'));
      tx.onerror = () => reject(tx.error ?? new Error('Collection was not saved. Export a backup.'));
    });
  } finally { db.close(); }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  return navigator.storage.persist();
}
