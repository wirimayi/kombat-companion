import {describe,it,expect} from 'vitest';
import 'fake-indexeddb/auto';
import {acceptScans,scoringCollection,validateScans} from './scans';
import {loadScans,saveScans} from './storage';
import {CHARACTERS,GEARS,recommend,TOWERS} from './game';
import type {OCRDraft} from './ocr';
const scan=(name:string,id:string|null,kind:OCRDraft['kind']='character'):OCRDraft=>({kind,id,name,recognized:true,ownedEvidence:true,level:kind==='gear'?null:60,fusion:null,ascension:null,raw:''});
describe('automatic screenshot collection',()=>{
 it('accepts identified cards outside strategy catalog without requiring user identification',()=>{const r=acceptScans([],[scan('MKII Movie Shao Kahn',null)]);expect(r.cards[0].name).toBe('MKII Movie Shao Kahn');expect(r.skipped).toBe(0);});
 it('does not import locked, unreadable or uncertain identities',()=>{const d=scan('MK11 Scorpion','mk11-scorpion');expect(acceptScans([],[{...d,ownedEvidence:false},{...d,recognized:false}]).cards).toEqual([]);});
 it('deduplicates repeated screenshots and retains previously known upgrades',()=>{const d=scan('MK11 Scorpion',CHARACTERS[0].id);const a=acceptScans([],[{...d,fusion:8,level:50}]).cards;const b=acceptScans(a,[{...d,level:50}, {...d,level:50}]).cards;expect(b).toHaveLength(1);expect(b[0].fusion).toBe(8);});
 it('keeps unread fusion null through persistence and estimates only in scoring',async()=>{const d=scan(CHARACTERS[0].name,CHARACTERS[0].id);const cards=acceptScans([],[d]).cards;await saveScans(cards);const loaded=await loadScans();expect(loaded).toEqual(cards);expect(loaded[0].fusion).toBeNull();expect(scoringCollection(loaded).characters[0].fusion).toBe(10);expect(loaded[0].fusion).toBeNull();});
 it('does not enable max-fusion gear bonuses from an unread badge',()=>{const cards=acceptScans([],[scan(GEARS[0].name,GEARS[0].id,'gear')]).cards;expect(scoringCollection(cards).gear[0].fusion).toBe(0);expect(cards[0].fusion).toBeNull();});
 it('produces a team with unique gear after auto-import without manual fields',()=>{const drafts=[...CHARACTERS.slice(0,9).map(c=>scan(c.name,c.id)),...GEARS.slice(0,16).map(g=>scan(g.name,g.id,'gear'))];const cards=acceptScans([],drafts).cards;const result=recommend(scoringCollection(cards),{mode:'tower',tower:TOWERS[0],difficulty:'normal',realmMode:'quick',playStyle:'manual',useKameo:true}).recommendations[0];expect(result.team).toHaveLength(3);const ids=result.team.flatMap(m=>m.gear.map(g=>g.id));expect(ids.length).toBeGreaterThanOrEqual(9);expect(new Set(ids).size).toBe(ids.length);});
 it('rejects invalid imported scan upgrades',()=>{expect(()=>validateScans([{...scan('A',null),available:true,level:100}])).toThrow();});
});
