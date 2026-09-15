import { CHARACTERS, GEARS, emptyCollection, type Collection } from './game';
import type { OCRDraft } from './ocr';
export type ScanCard = Pick<OCRDraft,'kind'|'name'|'id'|'level'|'fusion'|'ascension'> & { available:boolean };
const norm=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]/g,'');
/** Resolves older scans that were recognized before a strategy profile existed. */
export function catalogId(scan:Pick<ScanCard,'kind'|'name'|'id'>){
  const catalog=scan.kind==='gear'?GEARS:CHARACTERS;
  if(scan.id&&catalog.some(card=>card.id===scan.id))return scan.id;
  return catalog.find(card=>norm(card.name)===norm(scan.name))?.id??null;
}
export function acceptScans(previous:ScanCard[], drafts:OCRDraft[]) {
  const cards=new Map(previous.map(c=>[`${c.kind}:${c.name}`,c]));
  let skipped=0;
  for(const d of drafts){
    if(!(d.recognized??Boolean(d.id)) || !d.ownedEvidence){skipped++;continue;}
    const key=`${d.kind}:${d.name}`,old=cards.get(key);
    const id=catalogId(d)??d.id;
    cards.set(key,{kind:d.kind,name:d.name,id,level:d.level??old?.level??null,fusion:d.fusion??old?.fusion??null,ascension:d.ascension??old?.ascension??null,available:old?.available??d.available??true});
  }
  return {cards:[...cards.values()],skipped};
}
/** Estimates are a temporary scoring input. Unknown upgrades remain null in the saved collection. */
export function scoringCollection(scans:ScanCard[],saved:Collection=emptyCollection()):Collection {
  const result:Collection={...saved,characters:[...saved.characters],gear:[...saved.gear],kameos:[...saved.kameos],unknownCards:[...saved.unknownCards]};
  for(const s of scans){
    const id=catalogId(s);
    if(!id) continue;
    if(s.kind==='gear'){
      if(s.fusion!==null)result.gear=result.gear.map(c=>c.id===id?{...c,fusion:s.fusion!}:c);
      if(!result.gear.some(c=>c.id===id))result.gear.push({id,fusion:s.fusion??0});
    }else if(s.level!==null){
      if(s.kind==='character')result.characters=result.characters.map(c=>c.id===id?{...c,available:s.available,level:s.level!,fusion:s.fusion??c.fusion,ascension:s.ascension??c.ascension}:c);
      if(s.kind==='kameo')result.kameos=result.kameos.map(c=>c.id===id?{...c,available:s.available,level:s.level!,fusion:s.fusion??c.fusion}:c);
      if(s.kind==='character'&&!result.characters.some(c=>c.id===id))result.characters.push({id,level:s.level,fusion:s.fusion??(s.level>50?10:0),ascension:s.ascension??0,available:s.available});
      if(s.kind==='kameo'&&!result.kameos.some(c=>c.id===id))result.kameos.push({id,level:s.level,fusion:s.fusion??0,available:s.available});
    }
  }
  return result;
}
export function validateScans(value:unknown):ScanCard[]{
  if(!Array.isArray(value)||value.length>3000)throw Error('Invalid screenshot collection.');
  return value.map(v=>{
    if(!v||!['character','gear','kameo'].includes(v.kind)||typeof v.name!=='string'||!v.name.trim()||v.name.length>160||(v.id!==null&&typeof v.id!=='string')||typeof v.available!=='boolean')throw Error('Invalid screenshot card.');
    for(const [key,max,min] of [['level',60,1],['fusion',10,0],['ascension',10,0]] as const)if(v[key]!==null&&(!Number.isInteger(v[key])||v[key]<min||v[key]>max))throw Error('Invalid screenshot upgrades.');
    return {kind:v.kind,name:v.name,id:v.id,level:v.level,fusion:v.fusion,ascension:v.ascension,available:v.available};
  });
}
