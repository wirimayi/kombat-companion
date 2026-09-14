export interface CharacterDef { id:string; name:string; baseName:string; rarity:'gold'|'diamond'|'silver'|'bronze'; team:string; tags:string[]; source:string; stage1?:boolean; stage2?:boolean }
export interface GearDef { id:string; name:string; slot:'weapon'|'armor'|'accessory'; tags:string[]; fxTags?:string[]; tower?:string; source:string; character?:string; characterTags?:string[]; realmFxTags?:string[]; towerStat?:'damage'|'health'|'both' }
export interface OwnedCharacter { id:string; level:number; fusion:number; ascension:number; available:boolean; passive?:number; sp1?:number; sp2?:number }
export interface OwnedGear { id:string; fusion:number }
export interface OwnedKameo { id:string; level:number; fusion:number; available:boolean; attack1Effect?:string; attack2Effect?:string }
export interface Collection { characters:OwnedCharacter[]; gear:OwnedGear[]; kameos:OwnedKameo[]; talents:string; unknownCards:string[] }
export interface Settings { mode:'tower'|'krypt'|'realm'; tower:string; difficulty:string; realmMode:'quick'|'survivor'|'klash'; playStyle:'manual'|'auto'; useKameo:boolean }
export interface Recommendation { team:{character:OwnedCharacter; gear:OwnedGear[]; role:string; reasons:string[]}[]; score:number; explanation:string[]; rotation:string[]; warnings:string[]; kameo?:OwnedKameo; talentAdvice?:string[]; talentNotes?:string }
const officialSynergy='https://mortalkombatgamessupport.wbgames.com/hc/en-us/articles/360023753294-Team-Synergy-Guide';
const wiki='https://mortalkombat-mobile.fandom.com/wiki/';
export const DATA_VERSION='7.3 · checked 14 Sep 2026';
export const SOURCES=[{title:'Official team synergy guide',url:officialSynergy},{title:'Krypt structure update',url:'https://mortalkombatgamessupport.wbgames.com/hc/en-us/articles/36470811405075-MK-Mobile-Official-Patch-Notes-for-Update-6-1'},{title:'Realm Klash and its separate modes',url:'https://mortalkombatgamessupport.wbgames.com/hc/en-us/articles/45636689951251-Klash-Towers-Guide'},{title:'Kameo assists and progression',url:'https://mortalkombatgamessupport.wbgames.com/hc/en-us/articles/34168517139859-Kameos-FAQ'},{title:'Official talent changes',url:'https://mortalkombatgamessupport.wbgames.com/hc/en-us/articles/360056116214-MK-Mobile-Official-Release-Notes-for-Update-3-0'},{title:'Official event tower guide',url:'https://mortalkombatgamessupport.wbgames.com/hc/en-us/articles/31430934792467-Event-Tower-Equipment-Guide'},{title:'Official Update 7.3: ascension rules',url:'https://mortalkombatgamessupport.wbgames.com/hc/en-us/articles/53676870330515-MK-Mobile-Official-Patch-Notes-for-Update-7-3'},{title:'Community character reference (verify current card text)',url:wiki+'Characters'},{title:'Community equipment reference (verify current card text)',url:wiki+'Equipment'}];
export const TOWERS=['Hellspawn Tower','Black Dragon Tower','Shirai Ryu Tower','Edenian Tower','Elder Wind Tower','Lin Kuei Tower','Tower of Horror','Nightmare Tower','Sorcerer’s Tower','Earthrealm Tower','Dark Queen’s Tower','White Lotus Tower','Action Movie Tower','Klassic Tower','Twisted Tower','Kold Tower','Vought Tower','Tower of Time'];
const character=(id:string,name:string,baseName:string,rarity:CharacterDef['rarity'],team:string,tags:string[],stage1=false,stage2=false):CharacterDef=>({id,name,baseName,rarity,team,tags,stage1,stage2,source:['MK11','Strike Force','Circle of Shadow','Black Dragon','Day of the Dead','Kombat Cup'].includes(team)?officialSynergy:wiki+encodeURI(baseName.replaceAll(' ','_')+'/'+name.replace(baseName,'').trim().replaceAll(' ','_'))});
// Tags are qualitative editorial profiles, not a complete simulation of card passives.
export const CHARACTERS:CharacterDef[]=[
 character('mk11-scorpion','MK11 Scorpion','Scorpion','diamond','MK11',['damage','fire','dot','lethal','manual']),
 character('mk11-sindel','MK11 Sindel','Sindel','diamond','MK11',['control','blockbreak','support']),
 character('mk11-rain','MK11 Rain','Rain','diamond','MK11',['damage','power','lightning','manual']),
 character('mk11-jade','MK11 Jade','Jade','diamond','MK11',['sustain','defense']),
 character('mk11-raiden','MK11 Raiden','Raiden','diamond','MK11',['damage','control']),
 character('mk11-subzero','MK11 Sub-Zero','Sub-Zero','diamond','MK11',['defense','control']),
 character('mk11-kabal','MK11 Kabal','Kabal','diamond','MK11',['control','damage']),
 character('mk11-noob','MK11 Noob Saibot','Noob Saibot','diamond','MK11',['lethal','damage','support']),
 character('mk11-liu-kang','MK11 Liu Kang','Liu Kang','diamond','MK11',['damage','support']),
 character('mk11-shang-tsung','MK11 Shang Tsung','Shang Tsung','diamond','MK11',['sustain','support']),
 character('mk11-fujin','MK11 Fujin','Fujin','diamond','MK11',['control','support','manual']),
 character('klassic-liu-kang','Klassic Liu Kang','Liu Kang','diamond','Klassic',['damage','control','support']),
 character('klassic-raiden','Klassic Raiden','Raiden','diamond','Klassic',['damage','manual']),
 character('klassic-rain','Klassic Rain','Rain','diamond','Klassic',['support','manual']),
 character('klassic-reptile','Klassic Reptile','Reptile','diamond','Klassic',['dot','support','sustain']),
 character('klassic-scorpion','Klassic Scorpion','Scorpion','gold','Klassic',['damage','control','manual'],true),
 character('klassic-smoke','Klassic Smoke','Smoke','gold','Klassic',['defense','support']),
 character('klassic-shang-tsung','Klassic Shang Tsung','Shang Tsung','gold','Klassic',['support','sustain'],true,true),
 character('klassic-subzero','Klassic Sub-Zero','Sub-Zero','gold','Klassic',['damage','manual'],true,true),
 character('kombat-cup-johnny','Kombat Cup Johnny Cage','Johnny Cage','gold','Kombat Cup',['damage','control']),
 character('kombat-cup-sonya','Kombat Cup Sonya Blade','Sonya Blade','gold','Kombat Cup',['control','support','manual']),
 character('kombat-cup-cassie','Kombat Cup Cassie Cage','Cassie Cage','gold','Kombat Cup',['damage','support']),
 character('covert-ops-cassie','Covert Ops Cassie Cage','Cassie Cage','gold','Spec Ops',['blockbreak','support']),
 character('hanzo-scorpion','Hanzo Hasashi Scorpion','Scorpion','gold','Martial Artist',['damage','fire','dot','manual'],true,true),
 character('dark-raiden','Dark Raiden','Raiden','gold','Netherrealm',['sustain','damage']),
 character('elder-god-kenshi','Elder God Kenshi','Kenshi','gold','Elder God',['power','support'],true),
 character('triborg-smoke','Smoke Triborg','Triborg','gold','Triborg',['control','power'],true),
 character('triborg-sektor','Sektor Triborg','Triborg','gold','Triborg',['fire','dot']),
 character('triborg-cyrax','Cyrax Triborg','Triborg','gold','Triborg',['critical','support'],true),
 character('triborg-subzero','Sub-Zero Triborg','Triborg','gold','Triborg',['control','defense'],true),
 character('strike-force-johnny','Strike Force Johnny Cage','Johnny Cage','diamond','Strike Force',['damage','power']),
 character('strike-force-scorpion','Strike Force Scorpion','Scorpion','diamond','Strike Force',['sustain','defense']),
 character('ravenous-mileena','Ravenous Mileena','Mileena','diamond','Outworld',['dot','support','damage']),
 character('strike-force-cassie','Strike Force Cassie Cage','Cassie Cage','diamond','Strike Force',['damage','control','support']),
 character('cos-liu-kang','Circle of Shadow Liu Kang','Liu Kang','diamond','Circle of Shadow',['damage','critical','control','opener']),
 character('cos-kung-lao','Circle of Shadow Kung Lao','Kung Lao','diamond','Circle of Shadow',['power','support']),
 character('cos-subzero','Circle of Shadow Sub-Zero','Sub-Zero','diamond','Circle of Shadow',['damage','power','support']),
 character('cos-quan-chi','Circle of Shadow Quan Chi','Quan Chi','diamond','Circle of Shadow',['sustain','defense','support']),
 character('dod-kitana','Day of the Dead Kitana','Kitana','diamond','Day of the Dead',['sustain','support']),
 character('dod-jade','Day of the Dead Jade','Jade','diamond','Day of the Dead',['defense','control']),
 character('dod-erron','Day of the Dead Erron Black','Erron Black','diamond','Day of the Dead',['power','damage']),
 character('black-dragon-kabal','Black Dragon Kabal','Kabal','diamond','Black Dragon',['control','damage','support']),
 character('black-dragon-kano','Black Dragon Kano','Kano','diamond','Black Dragon',['power','control']),
 character('black-dragon-tremor','Black Dragon Tremor','Tremor','diamond','Black Dragon',['damage','defense','manual']),
 character('black-dragon-erron','Black Dragon Erron Black','Erron Black','diamond','Black Dragon',['damage','support']),
 character('pyromancer-tanya','Pyromancer Tanya','Tanya','gold','Outworld',['fire','support']),
];
const gear=(id:string,name:string,slot:GearDef['slot'],tags:string[],tower?:string,fxTags?:string[]):GearDef=>({id,name,slot,tags,tower,fxTags,source:wiki+name.replaceAll(' ','_')});
export const GEARS:GearDef[]=[
 gear('wrath-hammer','Wrath Hammer','weapon',['startingPower','damage'],undefined,['critical']),
 gear('bloody-tomahawk','Bloody Tomahawk','weapon',['control'],undefined,['startingPower']),
 gear('bladed-fan','Bladed Fan','weapon',['blockbreak'],undefined,['sustain']),
 gear('revolvers','Revolvers','weapon',['blockbreak'],undefined,['critical']),
 gear('rusty-chainsaw','Rusty Chainsaw','weapon',['blockbreak'],undefined,['efficiency']),
 gear('sento-blade','Sento Blade','weapon',['blockbreak']),
 gear('shirai-ryu-kunai','Shirai Ryu Kunai','weapon',['critical']),
 gear('dragon-essence','Dragon Essence','accessory',['power']),
 gear('vial-infinite-blood','Vial of Infinite Blood','accessory',['blockbreak'],undefined,['dot']),
 gear('blazes-life-force',"Blaze’s Life Force",'accessory',['fire','dot']),
 gear('soul-medallion','Soul Medallion','accessory',['power'],undefined,['efficiency']),
 gear('elemental-stones','Elemental Stones','accessory',['defense']),
 gear('body-armor','Body Armor','armor',['defense']),
 gear('storm-hat','Storm Hat','armor',['defense'],undefined,['power']),
 gear('shadow-sash','Shadow Sash','armor',['defense']),
 gear('living-dead','Living Dead','armor',['defense'],'Tower of Horror'),
 gear('wailing-spirit','Wailing Spirit','accessory',['control'],'Tower of Horror'),
 gear('princess-guard','Princess Guard','weapon',['control'],'Edenian Tower'),
 gear('dynasty-parade-uniform','Dynasty Parade Uniform','armor',['control'],'Edenian Tower'),
 gear('jinsei-hat','Jinsei Hat','armor',['critical'],'Earthrealm Tower'),
 gear('jinxed-whip','Jinxed Whip','weapon',['critical'],'Dark Queen’s Tower'),
 gear('muramasa-blades','Muramasa Blades','weapon',['blockbreak','damage'],'Shirai Ryu Tower'),
 gear('specter-chains',"Specter’s Infernal Chains",'accessory',['control','fire'],'Shirai Ryu Tower'),
 gear('leather-bracers',"Champion’s Leather Bracers",'armor',['defense','recovery'],'Shirai Ryu Tower'),
 gear('stone-fists','Stone Fists','weapon',['damage'],'Black Dragon Tower'),
 gear('witch-ward',"Witch’s Ward",'armor',['defense'],'Tower of Horror',['power']),
 gear('krypt-spider-fang','Krypt Spider Fang','weapon',['dot','control'],'Nightmare Tower'),
 gear('saurian-armor','Saurian Armor','armor',['defense'],undefined,['recovery']),
 gear('tribal-headband','Tribal Headband','accessory',['blockbreak']),
 gear('thunderblade','Thunderblade','weapon',['damage'],undefined,['efficiency']),
 gear('subtle-tattoo','Subtle Tattoo','accessory',['recovery'],undefined,['efficiency']),
 gear('shao-kahn-helmet',"Shao Kahn’s Helmet",'armor',['critical'],undefined,['defense']),
 gear('shintai-malice','Shintai of Malice','accessory',['defense'],'White Lotus Tower'),
];
export const emptyCollection=():Collection=>({characters:[],gear:[],kameos:[],talents:'',unknownCards:[]});
const def=(c:OwnedCharacter)=>CHARACTERS.find(d=>d.id===c.id);
export function slotCount(c:OwnedCharacter):number {const d=def(c);return d?.rarity==='diamond'||(d?.stage2&&c.ascension===10)?4:3;}
export function validateCharacter(c:OwnedCharacter):string[]{const d=def(c),errors:string[]=[];if(!d)return ['Unsupported character'];if(!Number.isInteger(c.level)||c.level<1||c.level>60)errors.push('Level must be 1–60');if(!Number.isInteger(c.fusion)||c.fusion<0||c.fusion>10)errors.push('Fusion must be 0–10');if(c.level>50&&c.fusion!==10)errors.push('Level above 50 requires Fusion X');if(!Number.isInteger(c.ascension)||c.ascension<0||c.ascension>10)errors.push('Ascension must be 0–10');if(c.ascension>0&&(c.fusion!==10||d.rarity!=='gold'||!d.stage1))errors.push('Ascension eligibility is not verified for this card');if(c.ascension>5&&!d.stage2)errors.push('Stage II eligibility is not verified');for(const [key,max] of [['passive',3],['sp1',10],['sp2',10]] as const){const value=c[key];if(value!==undefined&&(!Number.isInteger(value)||value<1||value>max))errors.push(`Invalid ${key} level`);}return errors;}

// All numbers below are editorial ranking weights, never claimed as in-game percentages.
const weights:Record<string,number>={damage:9,blockbreak:12,startingPower:11,power:8,efficiency:10,critical:7,lethal:8,fire:5,dot:7,control:6,support:0,sustain:8,defense:5,recovery:3,manual:0,lightning:5,opener:6};
const characterMap=new Map(CHARACTERS.map(c=>[c.id,c]));
const gearMap=new Map(GEARS.map(g=>[g.id,g]));
export const KAMEO_EFFECTS=['Damage','Stun','Freeze','Power Drain','Snare','Shield','Regeneration','Dispel','Cripple','Death Mark','Fire','Poison','Bleed'] as const;

// Conditional equipment bonuses never apply to unrelated fighters or modes.
const enhancements:Record<string,Partial<GearDef>>={
 'bladed-fan':{character:'Kitana',characterTags:['defense']},
 revolvers:{character:'Erron Black',characterTags:['damage']},
 'shirai-ryu-kunai':{character:'Scorpion',characterTags:['specialUnblockable']},
 'body-armor':{character:'Cassie Cage',characterTags:['resistance']},
 'sento-blade':{realmFxTags:['damage']},
 'dragon-essence':{realmFxTags:['damage']},
 'subtle-tattoo':{character:'Johnny Cage',characterTags:['damage']},
 'living-dead':{towerStat:'health'},'witch-ward':{towerStat:'health'},
 'leather-bracers':{towerStat:'health'},'muramasa-blades':{towerStat:'damage'},
 'stone-fists':{towerStat:'damage'},'krypt-spider-fang':{towerStat:'damage'},
 'specter-chains':{towerStat:'both'},'jinxed-whip':{towerStat:'damage'},
};
for(const g of GEARS)Object.assign(g,enhancements[g.id]??{});
const persistent=(s:Settings)=>s.mode==='krypt'||s.mode==='realm'&&s.realmMode==='survivor';
const difficultyWeight=(s:Settings)=>({normal:1,easy:.8,hard:1.25,fatal:1.5,elder:1.65,khaotic:2}[s.difficulty]??1);
function tagScore(tags:string[],s:Settings):number {
 return [...new Set(tags)].reduce((sum,t)=>{
  let value=weights[t]??(t==='resistance'?7:t==='specialUnblockable'?7:0);
  if(['sustain','defense','resistance','recovery'].includes(t))value*= (persistent(s)?1.6:1)*difficultyWeight(s)*(s.playStyle==='auto'?1.4:1);
  if(t==='dot'&&s.mode==='tower')value*=.65;
  if(t==='manual')value=s.playStyle==='auto'?-8:3;
  return sum+value;
 },0);
}
const progression=(c:OwnedCharacter)=>(.3+.7*c.level/60)*(1+c.fusion*.30+c.ascension*.04);
function attackStrength(c:OwnedCharacter,s:Settings):number {
 const d=characterMap.get(c.id)!;
 const offensive=d.tags.filter(t=>!['sustain','defense','support','recovery'].includes(t));
 const upgrades=((c.sp1??5)+(c.sp2??5))/20;
 return progression(c)*(22+tagScore(offensive,s))*(.8+.2*upgrades)+(d.tags.includes('opener')?24:0);
}
function strength(c:OwnedCharacter,s:Settings):number {
 const d=characterMap.get(c.id)!;
 return attackStrength(c,s)*.6+progression(c)*tagScore(d.tags.filter(t=>['sustain','defense','recovery','control'].includes(t)),s)*.45;
}
export function effectiveGearTags(g:OwnedGear,c:OwnedCharacter,s:Settings):string[]{
 const d=gearMap.get(g.id);if(!d)return [];
 return [...d.tags,...(g.fusion===10?d.fxTags??[]:[]),...(d.character===characterMap.get(c.id)?.baseName?d.characterTags??[]:[]),...(s.mode==='realm'&&g.fusion===10?d.realmFxTags??[]:[])];
}
export function synergyFor(team:OwnedCharacter[],s:Settings):{score:number;reasons:string[];tags:Map<string,string[]>}{
 let score=0;const reasons:string[]=[];const tags=new Map(team.map(c=>[c.id,[] as string[]]));
 const add=(provider:string,accept:(d:CharacterDef)=>boolean,effects:string[],reason:string)=>{
  const owner=team.find(c=>c.id===provider);if(!owner)return;
  const targets=team.filter(c=>c.id!==provider&&accept(characterMap.get(c.id)!));if(!targets.length)return;
  const potency=characterMap.get(provider)?.rarity==='diamond'?(owner.passive===undefined?.7:.5+owner.passive/6):1;
  for(const t of targets){score+=tagScore(effects,s)*potency*(.6+Math.min(1.2,progression(t)*.2));tags.get(t.id)!.push(...effects);}
  reasons.push(reason);
 };
 const family=(name:string)=>(d:CharacterDef)=>d.team===name;
 add('mk11-scorpion',family('MK11'),['lethal'],'MK11 Scorpion adds lethal-basic pressure to MK11 teammates.');
 add('mk11-sindel',family('MK11'),['blockbreak','resistance'],'MK11 Sindel helps MK11 teammates break blocks and resist stun.');
 add('mk11-shang-tsung',family('MK11'),['sustain'],'MK11 Shang Tsung restores health to the active MK11 fighter on enemy knockouts.');
 add('mk11-jade',family('MK11'),['sustain','resistance'],'MK11 Jade turns incoming Fire, Bleed and Poison into healing for MK11 teammates.');
 add('mk11-subzero',family('MK11'),['defense'],'MK11 Sub-Zero provides a rescue for each MK11 teammate.');
 add('mk11-raiden',family('MK11'),['resistance'],'MK11 Raiden protects MK11 teammates from power drain.');
 add('mk11-kabal',family('MK11'),['control'],'MK11 Kabal counters stuns affecting MK11 teammates.');
 add('mk11-fujin',d=>d.id==='mk11-rain'||d.id==='mk11-raiden',['damage'],'Fujin’s Hurricane can multiply Lightning hits from Rain or Raiden; this needs deliberate setup.');
 add('klassic-smoke',family('Klassic'),['resistance'],'Klassic Smoke adds debuff resistance and reflection to Klassic teammates.');
 add('klassic-shang-tsung',family('Klassic'),['sustain'],'Klassic Shang Tsung supports Klassic teammates through their Special 1 use.');
 add('kombat-cup-johnny',family('Kombat Cup'),['damage','defense'],'Kombat Cup Johnny strengthens Kombat Cup teammates.');
 add('kombat-cup-sonya',family('Kombat Cup'),['resistance'],'Kombat Cup Sonya gives Kombat Cup teammates stun immunity.');
 add('kombat-cup-cassie',family('Kombat Cup'),['resistance'],'Kombat Cup Cassie protects Kombat Cup teammates against Cripple.');
 add('covert-ops-cassie',d=>d.baseName==='Johnny Cage'||d.baseName==='Sonya Blade'||d.team==='Strike Force'||d.baseName==='Cassie Cage',['blockbreak'],'Covert Ops Cassie supplies block-breaking support to these Spec Ops fighters.');
 add('triborg-smoke',family('Triborg'),['control','power'],'Smoke shares power-draining Special 1 utility with Triborg teammates.');
 add('triborg-sektor',family('Triborg'),['fire','dot'],'Sektor shares Fire on Special 1 with Triborg teammates.');
 add('triborg-cyrax',family('Triborg'),['critical'],'Cyrax improves critical damage for Triborg teammates.');
 add('triborg-subzero',family('Triborg'),['control'],'Sub-Zero Triborg adds Frostbite utility to the Triborg Special 1 plan.');
 add('strike-force-scorpion',()=>true,['defense','sustain'],'Strike Force Scorpion can save teammates from a lethal blow.');
 add('strike-force-cassie',family('Strike Force'),['damage','defense'],'Strike Force Cassie strengthens her Strike Force teammates.');
 add('cos-kung-lao',family('Circle of Shadow'),['startingPower'],'Circle of Shadow Kung Lao gives his team power at the start of battle.');
 add('cos-subzero',family('Circle of Shadow'),['lethal'],'Circle of Shadow Sub-Zero adds lethal chance to his team.');
 add('cos-quan-chi',family('Circle of Shadow'),['sustain'],'Circle of Shadow Quan Chi grants his team vampirism on tag-in.');
 add('dod-kitana',d=>['Day of the Dead','Black Dragon','Outworld'].includes(d.team)||['mk11-shang-tsung','mk11-rain'].includes(d.id),['sustain'],'Day of the Dead Kitana helps these Outworld teammates recover after knockouts.');
 add('black-dragon-kabal',family('Black Dragon'),['specialUnblockable'],'Black Dragon Kabal makes his team’s specials and combo enders undodgeable. This does not remove blocking.');
 add('ravenous-mileena',d=>d.tags.includes('dot'),['dot'],'Ravenous Mileena amplifies teammates’ damage over time when it can affect the enemy.');
 return {score,reasons,tags};
}
function gearValue(g:OwnedGear,c:OwnedCharacter,s:Settings,existing:OwnedGear[],buffs:string[],index:number):number{
 const d=gearMap.get(g.id)!;const tags=effectiveGearTags(g,c,s);
 const covered=[...buffs,...existing.flatMap(x=>effectiveGearTags(x,c,s))];
 let value=tagScore(tags,s)*(1+g.fusion*.055);
 if(tags.includes('blockbreak')&&covered.includes('blockbreak'))value-=weights.blockbreak*.65;
 if(tags.includes('efficiency')&&covered.includes('efficiency'))value-=weights.efficiency*.65;
 if(s.mode==='tower'&&d.tower===s.tower){const offense=d.towerStat==='health'?.45:1;value+=(20+g.fusion*2)*offense;}
 const role=index===0?1.4:index===1?1:.8;
 value*=role;
 return value;
}
function eligible(c:OwnedCharacter,s:Settings):boolean{
 const d=characterMap.get(c.id)!;
 if((s.mode==='krypt'&&s.difficulty==='khaotic')||(s.mode==='realm'&&s.realmMode==='survivor'&&s.difficulty==='elder'))return d.rarity==='diamond'||!!d.stage2&&c.ascension>=6;
 if(s.mode==='realm'&&s.realmMode==='survivor'){
  if(s.difficulty==='easy')return d.rarity==='bronze'||d.rarity==='silver';
  if(s.difficulty==='normal')return d.rarity==='silver'||d.rarity==='gold';
 }
 return true;
}
const unique=(values:string[])=>[...new Set(values)];
export function recommend(collection:Collection,settings:Settings):{recommendations:Recommendation[];warnings:string[]}{
 const warnings:string[]=[];
 if(!['tower','krypt','realm'].includes(settings.mode)||!['manual','auto'].includes(settings.playStyle))return {recommendations:[],warnings:['Choose a supported mode and play style.']};
 if(settings.mode==='tower'&&!TOWERS.includes(settings.tower))return {recommendations:[],warnings:['Choose a supported named tower.']};
 const unknown=[...collection.unknownCards,...collection.characters.filter(c=>!characterMap.has(c.id)).map(c=>c.id),...collection.gear.filter(g=>!gearMap.has(g.id)).map(g=>g.id)];
 if(unknown.length)warnings.push(`${unknown.length} unsupported cards are not scored. A stronger combination may be missing.`);
 const seen=new Set<string>();let invalid=0,restricted=0;
 const characters=collection.characters.filter(c=>{
  if(seen.has(c.id)||validateCharacter(c).length){invalid++;return false;}seen.add(c.id);
  if(!c.available)return false;if(!eligible(c,settings)){restricted++;return false;}return true;
 });
 if(invalid)warnings.push(`${invalid} unsupported, duplicate or invalid fighter records excluded.`);
 if(restricted)warnings.push(`${restricted} fighters excluded by this difficulty’s rarity restrictions.`);
 if(persistent(settings))warnings.push('Check the game’s current entry screen and mark fatigued or defeated cards unavailable. The app checks known rarity rules, not every account unlock or fusion requirement.');
 if(characters.length<3)return {recommendations:[],warnings:[...warnings,'Add at least three supported, available fighters allowed in this difficulty.']};
 const gs=new Set<string>();const gears=collection.gear.filter(g=>{if(gs.has(g.id)||!gearMap.has(g.id)||!Number.isInteger(g.fusion)||g.fusion<0||g.fusion>10)return false;gs.add(g.id);return true;});
 const candidates:{cs:OwnedCharacter[];base:number;synergy:ReturnType<typeof synergyFor>}[]=[];
 for(let i=0;i<characters.length;i++)for(let j=i+1;j<characters.length;j++)for(let k=j+1;k<characters.length;k++){
  const cs=[characters[i],characters[j],characters[k]].sort((a,b)=>attackStrength(b,settings)-attackStrength(a,settings));
  const synergy=synergyFor(cs,settings);
  const shares=settings.playStyle==='auto'?[.65,.45,.35]:[1,.25,.2];
  const base=cs.reduce((v,c,n)=>v+strength(c,settings)*shares[n],0)+synergy.score;
  candidates.push({cs,base,synergy});
 }
 const ranked=candidates.sort((a,b)=>b.base-a.base).slice(0,120).map(({cs,base,synergy})=>{
  type Beam={used:Set<string>;loadouts:OwnedGear[][];score:number};let beam:Beam[]=[{used:new Set(),loadouts:cs.map(()=>[]),score:0}];
  for(let index=0;index<3;index++)for(let slot=0;slot<slotCount(cs[index]);slot++){
   const category=(['weapon','armor','accessory'] as const)[slot];const expanded:Beam[]=[];
   for(const state of beam){const buffs=synergy.tags.get(cs[index].id)??[];
    const options=gears.filter(g=>!state.used.has(g.id)&&(!category||gearMap.get(g.id)!.slot===category)).map(g=>({g,value:gearValue(g,cs[index],settings,state.loadouts[index],buffs,index)})).sort((a,b)=>b.value-a.value).slice(0,5);
    expanded.push(state);
    for(const {g,value} of options){const loadouts=state.loadouts.map(a=>[...a]);loadouts[index].push(g);expanded.push({used:new Set([...state.used,g.id]),loadouts,score:state.score+value});}
   }
   const distinct=new Map<string,Beam>();
   for(const state of expanded.sort((a,b)=>b.score-a.score)){const key=state.loadouts.map(gs=>gs.map(g=>g.id).sort().join(',')).join('|');if(!distinct.has(key))distinct.set(key,state);if(distinct.size>=12)break;}
   beam=[...distinct.values()];
  }
  const best=beam[0];
  const loadoutTags=best.loadouts.map((gs,i)=>gs.flatMap(g=>effectiveGearTags(g,cs[i],settings)));
  const talentAdvice:string[]=[];
  if(cs.some(c=>characterMap.get(c.id)!.tags.includes('dot'))||loadoutTags.some(t=>t.includes('dot')))talentAdvice.push('Consider Cruel Affliction for DOT damage and Exposing Weakness for specials against DOT-affected enemies, if unlocked.');
  talentAdvice.push('Death Mark Technique can help prevent resurrection. Check your available points and unlock path before changing presets.');
  if(settings.playStyle==='auto')talentAdvice.push('For Auto-Battle, favour passive protection and debuff resistance over strategies requiring precise counters.');
  let kameo:OwnedKameo|undefined;
  if(settings.useKameo){
   const effectTag=(value?:string)=>({Stun:'control',Freeze:'control','Power Drain':'control',Snare:'control',Shield:'defense',Regeneration:'sustain',Dispel:'resistance',Cripple:'control','Death Mark':'damage',Fire:'dot',Poison:'dot',Bleed:'dot',Damage:'damage'}[value??'']??'');
   kameo=collection.kameos.filter(k=>k.available&&characterMap.has(k.id)&&!cs.some(c=>c.id===k.id)&&Number.isInteger(k.level)&&k.level>0&&k.level<=60&&Number.isInteger(k.fusion)&&k.fusion>=0&&k.fusion<=10).sort((a,b)=>{
    const value=(k:OwnedKameo)=>k.level*.15+k.fusion*2+tagScore([effectTag(k.attack1Effect),...(settings.playStyle==='manual'?[effectTag(k.attack2Effect)]:[])],settings);
    return value(b)-value(a);
   })[0];
  }
  const resultWarnings=['Strategy estimate from a limited catalog; not a measured fastest-clear ranking.','Enemy-specific modifiers, boss immunities and finisher sets are not simulated.'];
  if(cs.some(c=>c.passive===undefined||c.sp1===undefined||c.sp2===undefined))resultWarnings.push('Some special/passive upgrades are unknown. Add them to improve comparison confidence.');
  if(cs.some(c=>characterMap.get(c.id)!.tags.includes('dot')))resultWarnings.push('Damage-over-time pressure can fail against immune enemies or enemies that heal from DOTs.');
  if(best.loadouts.some((gs,i)=>gs.length<slotCount(cs[i])))resultWarnings.push('Not every equipment slot could be filled from your supported collection.');
  if(kameo&&!kameo.attack1Effect&&!kameo.attack2Effect)resultWarnings.push('Kameo selected by its recorded progression only. Add its attack effects for a more useful comparison; fighter passives never transfer to Kameos.');
  if(settings.useKameo&&collection.kameos.length&&!kameo)resultWarnings.push('No available supported Kameo distinct from the selected fighters.');
  return {team:cs.map((c,i)=>({character:c,gear:best.loadouts[i],role:i===0?'Primary attacker':characterMap.get(c.id)!.tags.includes('sustain')?'Recovery support':'Control & support',reasons:[i===0?'Your strongest offensive core in this combination.':`Adds ${characterMap.get(c.id)!.tags.filter(t=>!['manual','support'].includes(t)).slice(0,2).join(' and ')} utility.`,best.loadouts[i].some(g=>settings.mode==='tower'&&gearMap.get(g.id)?.tower===settings.tower)?'Matching tower equipment strengthens this loadout.':loadoutTags[i].includes('blockbreak')?'Block-breaking equipment helps attacks connect.':'Uses available equipment suited to this role.']})),score:base+best.score,explanation:synergy.reasons.length?unique(synergy.reasons):['These fighters are selected for their owned progression and complementary combat roles. No verified shared team passive was found.'],rotation:[`Start with ${characterMap.get(cs[0].id)!.name}. ${loadoutTags[0].includes('startingPower')?'Use the starting power for an early special.':'Build power through basic attacks and combo enders.'}`,settings.playStyle==='manual'?'Use support tag-ins for their control or recovery, then return to your main damage dealer.':'Let Auto-Battle handle attacks; watch the first matches and intervene if health falls quickly.',persistent(settings)?'Preserve health between fights. A fragile fast fight can cost more time across the full run.':'Keep offensive pressure up; switch setup if a boss or modifier stops the damage plan.'],warnings:resultWarnings,kameo,talentAdvice,talentNotes:collection.talents||undefined} satisfies Recommendation;
 });
 return {recommendations:ranked.sort((a,b)=>b.score-a.score).slice(0,3),warnings:unique(warnings)};
}
