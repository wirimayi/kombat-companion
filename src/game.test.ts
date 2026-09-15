import {describe,it,expect} from 'vitest';
import {recommend,emptyCollection,slotCount,validateCharacter,GEARS,type OwnedCharacter,type Settings} from './game';
const c=(id:string,overrides:Partial<OwnedCharacter>={}):OwnedCharacter=>({id,level:50,fusion:5,ascension:0,available:true,...overrides});
const settings:Settings={mode:'tower',tower:'Tower of Horror',difficulty:'normal',realmMode:'quick',playStyle:'manual',useKameo:false};
const roster=()=>({...emptyCollection(),characters:[c('mk11-scorpion'),c('mk11-jade'),c('mk11-raiden')]});
describe('recommendation constraints',()=>{
 it('uses the vetted MK11 plan in its correct starting order',()=>{
  const collection={...emptyCollection(),characters:[c('mk11-raiden',{level:60,fusion:10}),c('mk11-jade',{level:60,fusion:10}),c('mk11-scorpion'),c('mk11-liu-kang'),c('mk11-subzero')],gear:GEARS.map(g=>({id:g.id,fusion:10}))};
  const result=recommend(collection,{...settings,fightType:'regular'}).recommendations[0];
  expect(result.planName).toBe('MK11 pressure and rescue');
  expect(result.team.map(m=>m.character.id)).toEqual(['mk11-liu-kang','mk11-scorpion','mk11-subzero']);
  expect(result.rotation[0]).toContain('Tag him in immediately');
  expect(new Set(result.team.flatMap(m=>m.gear.map(g=>g.id))).size).toBe(result.team.flatMap(m=>m.gear).length);
 });
 it('reserves the Soak plan for manual Tower bosses',()=>{
  const collection={...emptyCollection(),characters:[c('klassic-rain'),c('klassic-raiden'),c('klassic-liu-kang')],gear:GEARS.map(g=>({id:g.id,fusion:10}))};
  const boss=recommend(collection,{...settings,fightType:'boss'}).recommendations[0];
  expect(boss.planName).toBe('Klassic Soak boss team');
  expect(boss.rotation.join(' ')).toContain('Soaked');
  expect(recommend(collection,{...settings,fightType:'boss',playStyle:'auto'}).recommendations[0].planName).toBeUndefined();
 });
 it('fails gracefully on empty, unsupported, duplicate and unavailable cards',()=>{
  expect(recommend(emptyCollection(),settings).recommendations).toHaveLength(0);
  const collection=roster();collection.characters=[c('unknown'),c('mk11-jade'),c('mk11-jade'),c('mk11-raiden',{available:false})];
  expect(recommend(collection,settings).recommendations).toHaveLength(0);
 });
 it('unlocks fourth slot only for diamonds and verified max Stage II',()=>{
  expect(slotCount(c('mk11-scorpion'))).toBe(4);
  expect(slotCount(c('hanzo-scorpion',{fusion:10,ascension:9}))).toBe(3);
  expect(slotCount(c('hanzo-scorpion',{fusion:10,ascension:10}))).toBe(4);
  expect(validateCharacter(c('kombat-cup-johnny',{fusion:10,ascension:10}))).not.toHaveLength(0);
 });
 it('rejects impossible progression and prevents gear reuse across team',()=>{
  expect(validateCharacter(c('mk11-jade',{level:60,fusion:1}))).not.toHaveLength(0);
  const collection=roster();collection.gear=GEARS.map(g=>({id:g.id,fusion:5}));
  const result=recommend(collection,settings).recommendations[0];const ids=result.team.flatMap(x=>x.gear.map(g=>g.id));
  expect(new Set(ids).size).toBe(ids.length);
  for(const member of result.team){expect(member.gear.length).toBeLessThanOrEqual(slotCount(member.character));const slots=member.gear.map(g=>GEARS.find(x=>x.id===g.id)!.slot);expect(Math.max(...['weapon','armor','accessory'].map(s=>slots.filter(x=>x===s).length))).toBeLessThanOrEqual(2);}
 });
 it('applies tower equipment advantage only in its matching tower',()=>{
  const collection=roster();collection.gear=[{id:'living-dead',fusion:1}];
  const matching=recommend(collection,settings).recommendations[0].score;
  const other=recommend(collection,{...settings,tower:'Edenian Tower'}).recommendations[0].score;
  expect(matching).toBeGreaterThan(other);
  const kryptA=recommend(collection,{...settings,mode:'krypt'}).recommendations[0].score;
  const kryptB=recommend(collection,{...settings,mode:'krypt',tower:'Edenian Tower'}).recommendations[0].score;
  expect(kryptA).toBe(kryptB);
 });
 it('does not enable a fusion-X-only starting power effect early',()=>{
  const collection=roster();collection.gear=[{id:'bloody-tomahawk',fusion:9}];
  const before=recommend(collection,settings).recommendations[0].score;
  collection.gear[0].fusion=10;
  expect(recommend(collection,settings).recommendations[0].score).toBeGreaterThan(before);
 });
 it('excludes ordinary gold from Khaotic and allows verified Stage II',()=>{
  const collection=roster();collection.characters=[c('hanzo-scorpion',{fusion:10,ascension:6}),c('mk11-jade'),c('klassic-scorpion')];
  expect(recommend(collection,{...settings,mode:'krypt',difficulty:'khaotic'}).recommendations).toHaveLength(0);
  collection.characters[2]=c('mk11-scorpion');
  expect(recommend(collection,{...settings,mode:'krypt',difficulty:'khaotic'}).recommendations).toHaveLength(1);
 });
});

import {effectiveGearTags,synergyFor} from './game';
describe('conditional strategy rules',()=>{
 it('gates common fusion-X bonuses and respects character identity',()=>{
  expect(effectiveGearTags({id:'wrath-hammer',fusion:9},c('mk11-scorpion'),settings)).not.toContain('critical');
  expect(effectiveGearTags({id:'wrath-hammer',fusion:10},c('mk11-scorpion'),settings)).toContain('critical');
  expect(effectiveGearTags({id:'bladed-fan',fusion:9},c('mk11-jade'),settings)).not.toContain('sustain');
  expect(effectiveGearTags({id:'body-armor',fusion:10},c('mk11-jade'),settings)).not.toContain('resistance');
  expect(effectiveGearTags({id:'body-armor',fusion:0},c('covert-ops-cassie'),settings)).toContain('resistance');
 });
 it('enables legacy Faction Wars gear effects only in Realm Klash',()=>{
  const item={id:'sento-blade',fusion:10};
  expect(effectiveGearTags(item,c('mk11-scorpion'),settings)).not.toContain('damage');
  expect(effectiveGearTags(item,c('mk11-scorpion'),{...settings,mode:'realm'})).toContain('damage');
  expect(effectiveGearTags({...item,fusion:9},c('mk11-scorpion'),{...settings,mode:'realm'})).not.toContain('damage');
 });
 it('does not grant a family bonus merely because names match',()=>{
  const unrelated=synergyFor([c('klassic-raiden'),c('klassic-rain'),c('klassic-scorpion')],settings);
  expect(unrelated.reasons).toHaveLength(0);
  const withSindel=synergyFor([c('mk11-sindel'),c('mk11-scorpion'),c('mk11-jade')],settings);
  expect(withSindel.tags.get('mk11-scorpion')).toContain('blockbreak');
  const withoutMK11=synergyFor([c('mk11-sindel'),c('klassic-scorpion'),c('klassic-rain')],settings);
  expect(withoutMK11.tags.get('klassic-scorpion')).not.toContain('blockbreak');
 });
 it('keeps gold equipment assignments within three distinct categories',()=>{
  const collection={...emptyCollection(),characters:[c('klassic-scorpion'),c('klassic-smoke'),c('kombat-cup-johnny')],gear:GEARS.map(g=>({id:g.id,fusion:10}))};
  for(const member of recommend(collection,settings).recommendations[0].team){
   const cats=member.gear.map(g=>GEARS.find(d=>d.id===g.id)!.slot);
   expect(cats.length).toBeLessThanOrEqual(3);expect(new Set(cats).size).toBe(cats.length);
  }
 });
 it('protects easy/normal and Elder Survivor entry classes',()=>{
  expect(recommend(roster(),{...settings,mode:'realm',realmMode:'survivor',difficulty:'easy'}).recommendations).toHaveLength(0);
  expect(recommend(roster(),{...settings,mode:'realm',realmMode:'survivor',difficulty:'normal'}).recommendations).toHaveLength(0);
  const collection=roster();collection.characters[2]=c('klassic-scorpion');
  expect(recommend(collection,{...settings,mode:'realm',realmMode:'survivor',difficulty:'elder'}).recommendations).toHaveLength(0);
 });
 it('uses optional Kameo effects and avoids selected fighter identities',()=>{
  const collection=roster();collection.kameos=[{id:'mk11-scorpion',level:60,fusion:10,available:true},{id:'klassic-subzero',level:50,fusion:5,available:true,attack1Effect:'Freeze'}];
  const result=recommend(collection,{...settings,useKameo:true}).recommendations[0];
  expect(result.kameo?.id).toBe('klassic-subzero');
  expect(recommend(collection,{...settings,useKameo:false}).recommendations[0].kameo).toBeUndefined();
 });
 it('surfaces unsupported equipment instead of quietly claiming full coverage',()=>{
  const collection=roster();collection.gear=[{id:'unknown-gear',fusion:10}];
  expect(recommend(collection,settings).warnings.join(' ')).toContain('unsupported');
 });
 it('uses different reliability weights for auto and demanding runs',()=>{
  const collection=roster();collection.gear=GEARS.map(g=>({id:g.id,fusion:5}));
  const manual=recommend(collection,{...settings,mode:'krypt',difficulty:'normal'}).recommendations[0];
  const auto=recommend(collection,{...settings,mode:'krypt',difficulty:'elder',playStyle:'auto'}).recommendations[0];
  expect(auto.score).not.toBe(manual.score);expect(auto.rotation.join(' ')).toContain('Auto-Battle');
 });
});
