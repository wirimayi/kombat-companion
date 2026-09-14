import {describe,it,expect,vi} from 'vitest';
import 'fake-indexeddb/auto';
import {exportBackup,parseBackup,mergeCollections,validateCollection,loadCollection,saveCollection} from './storage';
import type {Collection} from './game';

const collection = ():Collection => ({characters:[{id:'unknown-character',level:30,fusion:2,ascension:0,available:true}],gear:[{id:'gear-1',fusion:0}],kameos:[],talents:'Offense',unknownCards:[]});

describe('collection backups',() => {
  it('round trips unknown IDs without inventing card effects',() => {
    expect(parseBackup(exportBackup(collection()))).toEqual(collection());
  });
  it('rejects unsupported versions and malformed or oversized JSON',() => {
    const backup = JSON.parse(exportBackup(collection()));
    expect(() => parseBackup(JSON.stringify({...backup,version:2}))).toThrow(/version/);
    expect(() => parseBackup('{')).toThrow(/JSON/);
    expect(() => parseBackup('x'.repeat(2_000_001))).toThrow(/2 MB/);
  });
  it('rejects duplicate IDs and injected effect fields',() => {
    const c = collection();
    expect(() => validateCollection({...c,characters:[...c.characters,...c.characters]})).toThrow(/Duplicate/);
    expect(() => validateCollection({...c,gear:[{id:'gear-1',fusion:0,damage:999999}]})).toThrow(/unsupported/);
  });
  it.each([-1,11,NaN,1.5,'2',null])('rejects bad fusion %s',fusion => {
    expect(() => validateCollection({...collection(),gear:[{id:'gear-1',fusion}]})).toThrow();
  });
  it('rejects invalid availability, level, ascension and special values',() => {
    for (const invalid of [{available:'true'},{level:0},{level:61},{ascension:11},{sp1:11},{passive:4}]) {
      const c = collection();
      expect(() => validateCollection({...c,characters:[{...c.characters[0],...invalid}]})).toThrow();
    }
  });
  it('rejects malformed root and unknown cards',() => {
    expect(() => validateCollection(null)).toThrow();
    expect(() => validateCollection({...collection(),unknownCards:[{}]})).toThrow();
    expect(() => validateCollection({...collection(),gear:'gear'})).toThrow();
  });
});

describe('explicit collection merges',() => {
  it('keeps current values by default while adding new cards',() => {
    const a = collection(), b = collection();
    b.characters[0].fusion=10;
    b.gear.push({id:'new-gear',fusion:3});
    b.talents='Defense';
    const result = mergeCollections(a,b,false);
    expect(result.characters[0].fusion).toBe(2);
    expect(result.gear).toHaveLength(2);
    expect(result.talents).toBe('Offense');
    expect(a.gear).toHaveLength(1);
  });
  it('overwrites conflicts only when requested and retains unrelated cards',() => {
    const a=collection(),b=collection();
    b.characters[0].fusion=10;
    b.gear=[];
    b.talents='Defense';
    a.unknownCards=['a']; b.unknownCards=['a','b'];
    const result=mergeCollections(a,b,true);
    expect(result.characters[0].fusion).toBe(10);
    expect(result.gear).toEqual(a.gear);
    expect(result.talents).toBe('Defense');
    expect(result.unknownCards).toEqual(['a','b']);
  });
});

describe('storage failures',() => {
  it('persists and reloads a validated collection',async () => {
    await saveCollection(collection());
    expect(await loadCollection()).toEqual(collection());
  });
  it('rejects invalid data before replacing the saved collection',async () => {
    await saveCollection(collection());
    await expect(saveCollection({...collection(),gear:[{id:'bad',fusion:20}]})).rejects.toThrow();
    expect(await loadCollection()).toEqual(collection());
  });
  it('reports unavailable browser storage instead of silently losing data',async () => {
    vi.stubGlobal('indexedDB',undefined);
    try { await expect(loadCollection()).rejects.toThrow(/unavailable/); }
    finally { vi.unstubAllGlobals(); }
  });
});
