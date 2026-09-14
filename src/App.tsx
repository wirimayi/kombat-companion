import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, Crosshair, Flame, Layers3, LoaderCircle, Plus, Search, Shield, Sparkles, Swords, Trash2, Upload, Users, WifiOff, X, Zap, Smartphone, Settings2, Pencil, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { CHARACTERS, GEARS, KAMEO_EFFECTS, TOWERS, SOURCES, DATA_VERSION, recommend, emptyCollection, validateCharacter } from './game';
import type { Collection, OwnedCharacter, OwnedGear, OwnedKameo, Settings, Recommendation } from './game';
import { loadCollection, saveCollection, exportBackup, parseBackup, mergeCollections } from './storage';
import { recognizeScreenshot } from './ocr';
import type { OCRDraft } from './ocr';

type Page = 'builder' | 'collection' | 'notes';
type Kind = 'character' | 'gear' | 'kameo';
type Draft = OCRDraft & {key:string; available:boolean; passive:string;sp1:string;sp2:string;attack1Effect:string;attack2Effect:string};
const character = (id:string) => CHARACTERS.find(c => c.id === id);
const gear = (id:string) => GEARS.find(c => c.id === id);
const initials = (name:string) => name.split(' ').slice(-2).map(s => s[0]).join('');
const fusionLabel = (n:number) => n === 0 ? 'F0' : `F${['','I','II','III','IV','V','VI','VII','VIII','IX','X'][n] ?? n}`;
const newDraft = (kind:Kind):Draft => ({key:crypto.randomUUID(),kind,id:null,name:'',level:null,fusion:null,ascension:0,raw:'',available:true,passive:'',sp1:'',sp2:'',attack1Effect:'',attack2Effect:''});
const asError = (e:unknown) => e instanceof Error ? e.message : 'Something went wrong. Please try again.';
function makeDemo():Collection {
  const names = ['MK11 Scorpion','MK11 Sindel','MK11 Shang Tsung','MK11 Jade','MK11 Sub-Zero','Kombat Cup Johnny Cage','Kombat Cup Sonya Blade','Strike Force Scorpion','Circle of Shadow Liu Kang'];
  const chosen = CHARACTERS.filter(c => names.includes(c.name));
  return {characters:(chosen.length >= 3 ? chosen : CHARACTERS.slice(0,9)).map((c,i) => ({id:c.id,level:50,fusion:i<3?5:3,ascension:0,available:true,passive:3,sp1:10,sp2:10})),gear:GEARS.slice(0,16).map((g,i) => ({id:g.id,fusion:i%3 === 0?10:3})), kameos:[],talents:'',unknownCards:[]};
}
const defaultSettings:Settings = {mode:'tower',tower:TOWERS[0],difficulty:'normal',realmMode:'quick',playStyle:'manual',useKameo:true};

export default function App() {
  const [page,setPage] = useState<Page>('builder');
  const [collection,setCollection] = useState<Collection>(emptyCollection());
  const [ready,setReady] = useState(false);
  const [saving,setSaving] = useState(false);
  const saveLock=useRef(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [demo,setDemo] = useState(false);
  const [settings,setSettings] = useState<Settings>(defaultSettings);
  const [results,setResults] = useState<ReturnType<typeof recommend>|null>(null);
  const [building,setBuilding] = useState(false);
  const [alternative,setAlternative] = useState(0);
  const [offline,setOffline] = useState(!navigator.onLine);
  const [ocrReady,setOcrReady] = useState(false);
  const [ocrCaching,setOcrCaching] = useState(false);
  const data = demo ? makeDemo() : collection;
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live=true;
    loadCollection().then(c => {if(live && c)setCollection(c);}).catch(e => live && setError(`Your collection could not be loaded: ${asError(e)}. Import a backup to recover it.`)).finally(() => live && setReady(true));
    const online = () => setOffline(!navigator.onLine);
    const fail = () => setError('Offline setup was unavailable. You can still use the app online.');
    window.addEventListener('online',online);window.addEventListener('offline',online);window.addEventListener('offline-error',fail);
    if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',serviceMessage);
    async function serviceMessage(event:MessageEvent) {
      if(event.data?.type === 'OCR_CACHED') {setOcrReady(true);setOcrCaching(false);setNotice('Screenshot recognition is ready offline.');}
      if(event.data?.type === 'OCR_CACHE_ERROR') {setOcrCaching(false);setError('Could not download offline recognition. Try again with a connection.');}
    }
    if('caches' in window) caches.open('kombat-ocr-v1').then(c => c.match(new URL('./ocr/lang/eng.traineddata.gz',location.href))).then(r => live && setOcrReady(!!r)).catch(()=>{});
    return () => {live=false;window.removeEventListener('online',online);window.removeEventListener('offline',online);window.removeEventListener('offline-error',fail);navigator.serviceWorker?.removeEventListener('message',serviceMessage);};
  },[]);
  useEffect(() => {setResults(null);setAlternative(0);},[collection,demo,settings]);
  useEffect(() => {if(notice){const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);}},[notice]);
  const persist = async (next:Collection) => {
    if(saveLock.current)return false;saveLock.current=true;setSaving(true);setError('');
    try {await saveCollection(next);setCollection(next);return true;} catch(e) {setError(`Could not save: ${asError(e)}. Your existing collection is unchanged.`);return false;} finally {saveLock.current=false;setSaving(false);}
  };
  const build = () => {
    setBuilding(true);setError('');
    window.setTimeout(() => {
      try {setResults(recommend(data,settings));setAlternative(0);window.setTimeout(()=>resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),100);}
      catch(e){setError(`Could not build a team: ${asError(e)}`);} finally {setBuilding(false);}
    },80);
  };
  const download = () => {
    const blob=new Blob([exportBackup(collection)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`kombat-collection-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);setNotice('Backup prepared. Save it to Files on your iPhone.');
  };
  const cacheOCR = async () => {
    if(!('serviceWorker' in navigator)){setError('Offline recognition is not supported in this browser.');return;}
    if(!navigator.serviceWorker.controller){setError('Offline setup is not ready yet. Reload the installed app, then try again.');return;}
    setOcrCaching(true);navigator.serviceWorker.controller.postMessage({type:'CACHE_OCR'});
  };
  if(!ready) return <div className="loading-screen"><LoaderCircle className="spin"/><p>Opening your collection…</p></div>;
  return <div className="app-shell">
    <aside className="sidebar">
      <a href="#" className="brand" onClick={e=>{e.preventDefault();setPage('builder');}} aria-label="Kombat Companion home"><span className="brand-mark">K</span><span>KOMBAT<small>COMPANION</small></span></a>
      <div className="sidebar-label">YOUR PLAYBOOK</div>
      <nav>{([{id:'builder',label:'Build a team',icon:Swords},{id:'collection',label:'My collection',icon:Layers3},{id:'notes',label:'Field notes',icon:BookOpen}] as const).map(item=><button key={item.id} className={`nav-item ${page===item.id?'selected':''}`} onClick={()=>setPage(item.id)}><item.icon size={19}/>{item.label}{item.id==='collection'&&<span className="nav-count">{collection.characters.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-card"><Shield size={20}/><strong>Your cards. Your device.</strong><p>No login. No subscription.<br/>Your collection stays with you.</p></div><span className="build-label"><i/> FREE & LOCAL</span></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><span className="mobile-brand"><span className="brand-mark">K</span> KOMPANION</span><span className="breadcrumb">Your playbook <ChevronRight size={13}/> {page==='builder'?'Build a team':page==='collection'?'My collection':'Field notes'}</span><span className="connection">{offline?<><WifiOff size={13}/> Offline</>:<><span className="status-dot"/> On your device</>}</span></header>
      <main>
        {demo&&<div className="demo-banner"><Sparkles size={16}/><span>Demo collection · sample cards, separate from yours</span><button onClick={()=>setDemo(false)}>Exit demo <X size={14}/></button></div>}
        {error&&<div className="alert error" role="alert"><AlertCircle size={18}/><span>{error}</span><button aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}
        {notice&&<div className="toast" role="status"><CheckCircle2 size={17}/>{notice}</div>}
        {page==='builder'&&<>
          <section className="page-intro"><div className="eyebrow"><span/> MAKE EVERY MATCH COUNT</div><h1>Stronger teams.<br/><span>Shorter battles.</span></h1><p>Your fighters and gear, working better together.<br className="desktop-only"/> Find your next lineup and get back to the fight.</p></section>
          <div className="builder-layout"><div className="builder-main">
            <div className="section-title"><h2><span className="step">01</span> Choose your battleground</h2><span className="muted text-small">General mode advice</span></div>
            <div className="mode-grid">{([{id:'tower',name:'Towers',detail:'Climb. Clear. Repeat.',icon:Layers3},{id:'krypt',name:'Krypt',detail:'Go further, faster.',icon:Flame},{id:'realm',name:'Realm Klash',detail:'Fight for your realm.',icon:Swords}] as const).map(m=><button key={m.id} className={`mode-card ${settings.mode===m.id?'active':''}`} aria-pressed={settings.mode===m.id} onClick={()=>setSettings({...settings,mode:m.id,difficulty:'normal'})}><m.icon size={28} strokeWidth={1.5}/><span className="mode-check">{settings.mode===m.id&&<Check size={12}/>}</span><strong>{m.name}</strong><small>{m.detail}</small></button>)}</div>
            <section className="configuration panel">
              <div className="field-grid">
                {settings.mode==='tower'&&<><label>Tower<select value={settings.tower} onChange={e=>setSettings({...settings,tower:e.target.value})}>{TOWERS.map(t=><option key={t}>{t}</option>)}</select></label><label>Difficulty<select value={settings.difficulty} onChange={e=>setSettings({...settings,difficulty:e.target.value})}><option value="normal">Normal / Regular</option><option value="fatal">Fatal</option></select></label></>}
                {settings.mode==='krypt'&&<><label>Krypt difficulty<select value={settings.difficulty} onChange={e=>setSettings({...settings,difficulty:e.target.value})}>{['normal','hard','elder','khaotic'].map(d=><option key={d} value={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}</select></label><div className="field-help"><Shield size={18}/><p>Damage with enough recovery to keep your run moving.</p></div></>}
                {settings.mode==='realm'&&<><label>Realm Klash mode<select value={settings.realmMode} onChange={e=>setSettings({...settings,realmMode:e.target.value as Settings['realmMode'],difficulty:'normal'})}><option value="quick">Quick Play</option><option value="survivor">Survivor</option><option value="klash">Klash Tower attacks</option></select></label>{settings.realmMode==='survivor'?<label>Difficulty<select value={settings.difficulty} onChange={e=>setSettings({...settings,difficulty:e.target.value})}>{['easy','normal','hard','fatal','elder'].map(d=><option key={d} value={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}</select></label>:<div className="field-help"><Swords size={18}/><p>Offensive teams built from your owned collection.</p></div>}</>}
              </div>
              <div className="playstyle"><div><strong>How are you playing?</strong><small>{settings.playStyle==='manual'?'Take control of specials and tag-ins.':'Favour reliable, low-intervention combinations.'}</small></div><div className="segmented"><button className={settings.playStyle==='manual'?'active':''} aria-pressed={settings.playStyle==='manual'} onClick={()=>setSettings({...settings,playStyle:'manual'})}><Crosshair size={15}/> Manual</button><button className={settings.playStyle==='auto'?'active':''} aria-pressed={settings.playStyle==='auto'} onClick={()=>setSettings({...settings,playStyle:'auto'})}><Zap size={15}/> Auto-Battle</button></div></div>
              <label className="check-label"><input type="checkbox" checked={settings.useKameo} onChange={e=>setSettings({...settings,useKameo:e.target.checked})}/> Include an available Kameo, if I’ve added one</label>
            </section>
            <div className="section-title collection-title"><h2><span className="step">02</span> Bring your collection</h2><button className="text-button" onClick={()=>setPage('collection')}>{collection.characters.length?'Manage':'Add cards'} <ArrowRight size={14}/></button></div>
            <section className="roster-summary panel"><div className="roster-icon"><Users size={24}/></div><div><strong>{data.characters.length?`${data.characters.length} fighters in your corner`:'Your next great team starts here'}</strong><p>{data.characters.length?`${data.characters.filter(c=>c.available).length} available · ${data.gear.length} equipment cards · ${data.kameos.length} Kameos`:'Add your fighters and gear to get a personal recommendation.'}</p></div>{data.characters.length>0&&<CheckCircle2 className="lime" size={22}/>}</section>
            <button className="build-button" disabled={data.characters.filter(c=>c.available).length<3||building||saving} onClick={build}>{building?<LoaderCircle size={20} className="spin"/>:<Sparkles size={20}/>} {building?'Finding your lineup…':'Find my team'}<ArrowRight size={20}/></button>
            <div className="build-footnote"><Shield size={13}/> Uses your owned cards · Keeps your collection private</div>
            {!data.characters.length&&<button className="demo-link" onClick={()=>setDemo(true)}>Just looking around? <span>Try a demo collection <ArrowRight size={13}/></span></button>}
          </div><aside className="strategy-aside"><div className="strategy-card"><div className="eyebrow">THE GAME PLAN</div><div className="strategy-emblem"><Swords size={42} strokeWidth={1}/><span className="orbit orbit-one"/><span className="orbit orbit-two"/></div><h3>Built to work<br/><em>as a team.</em></h3><p>The strongest lineup is more than three strong cards.</p><ul><li><Zap size={17}/><div><strong>Damage that lands</strong><span>Power, block breaking and synergy.</span></div></li><li><Shield size={17}/><div><strong>Stay in the fight</strong><span>Enough sustain to finish the run.</span></div></li><li><Settings2 size={17}/><div><strong>Gear with a purpose</strong><span>Matched to the fighter and mode.</span></div></li></ul><button className="text-button" onClick={()=>setPage('notes')}>How recommendations work <ArrowRight size={14}/></button></div><div className="quiet-note"><CircleHelp size={16}/><p>General team recommendations. Individual bosses and modifiers can still need a different setup.</p></div></aside></div>
          <div ref={resultRef} className="results-anchor">{results&&<><div className="section-title"><h2><span className="step">03</span> Your recommended lineup</h2>{demo&&<span className="pill">DEMO</span>}</div>{results.warnings.length>0&&<div className="alert warning"><CircleHelp size={18}/><div>{results.warnings.map((w,i)=><p key={i}>{w}</p>)}</div></div>}{results.recommendations.length?<><TeamResult result={results.recommendations[alternative]} settings={settings}/>{results.recommendations.length>1&&<button className="secondary alternative" onClick={()=>setAlternative((alternative+1)%results.recommendations.length)}><RotateCcw size={16}/> {alternative===0?'Show another option':`Option ${alternative+1} of ${results.recommendations.length} · next`}</button>}</>:<div className="panel empty"><Shield size={28}/><h3>No eligible lineup yet</h3><p>Add at least three supported, available fighters that meet this mode’s requirements.</p><button className="secondary" onClick={()=>setPage('collection')}>Review collection</button></div>}</>}</div>
        </>}
        <div hidden={page!=='collection'}><CollectionPage collection={collection} saving={saving} persist={persist} notify={setNotice} fail={setError} download={download} exitDemo={()=>setDemo(false)}/></div>
        {page==='notes'&&<section className="notes-page"><div className="eyebrow">A LITTLE CONTEXT</div><h1>Your field notes.</h1><p className="lead">Know what’s behind your next lineup.</p><div className="notes-grid"><article className="panel"><Zap className="lime"/><h2>Fast, with staying power.</h2><p>Teams are compared using offensive synergy, access to specials, block breaking and recovery. Equipment is assigned across the whole team, with tower bonuses and fusion unlocks respected.</p><p>Manual play favours combinations you can actively coordinate. Auto-Battle gives more weight to passive pressure and sustain.</p><p className="muted">These are strategy estimates, not a battle simulator or measured clear-time rankings.</p></article><article className="panel"><BookOpen className="lime"/><h2>Checked rules. Honest gaps.</h2><p>The current starter catalog covers {CHARACTERS.length} fighters and {GEARS.length} equipment cards. Unsupported cards can be tracked in your collection but cannot be scored until their mechanics are verified.</p><p>Missing upgrade levels lower confidence. Talents include conditional suggestions alongside your saved setup; the engine does not assume unverified talent bonuses.</p><span className="pill">Rules {DATA_VERSION}</span></article><article className="panel"><Smartphone className="lime"/><h2>Make it feel like an app.</h2><ol><li>Open this page in Safari on your iPhone.</li><li>Tap Share, then Add to Home Screen.</li><li>Open the new icon and add your collection there.</li></ol><p>Your browser and Home Screen app may use separate storage. Export a backup first if you’ve already added cards.</p><button className="secondary" onClick={download}><ArrowDownToLine size={16}/> Export my collection</button></article><article className="panel"><WifiOff className="lime"/><h2>Ready when you are.</h2><p>Your collection and recommendations work offline once the app is installed and loaded. Screenshot reading needs a one-time download of its recognition files.</p><button className="secondary" disabled={ocrReady||ocrCaching||offline} onClick={cacheOCR}>{ocrCaching?<LoaderCircle size={16} className="spin"/>:ocrReady?<Check size={16}/>:<ArrowDownToLine size={16}/>} {ocrReady?'Recognition saved offline':ocrCaching?'Downloading recognition…':'Enable offline screenshots'}</button><p className="text-small muted">Keep a backup in Files. Clearing browser data can remove your collection.</p></article></div><div className="section-title"><h2>Sources behind the strategy</h2></div><div className="sources panel">{SOURCES.map((s,i)=><a key={i} href={s.url} target="_blank" rel="noreferrer"><span><BookOpen size={16}/>{s.title}</span><ArrowRight size={15}/></a>)}</div></section>}
        <footer><span>KOMBAT COMPANION</span><p>An independent fan companion. Not affiliated with Warner Bros. or NetherRealm Studios.</p><span>PLAY SMARTER.</span></footer>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Main navigation"><button className={page==='builder'?'active':''} onClick={()=>setPage('builder')}><Swords size={21}/>Build team</button><button className={page==='collection'?'active':''} onClick={()=>setPage('collection')}><Layers3 size={21}/>Collection</button><button className={page==='notes'?'active':''} onClick={()=>setPage('notes')}><BookOpen size={21}/>Field notes</button></nav>
  </div>;
}

function TeamResult({result,settings}:{result:Recommendation;settings:Settings}) {
  return <section className="team-result"><div className="result-heading"><div><span className="eyebrow">{settings.playStyle==='auto'?'AUTO-BATTLE':'MANUAL PLAY'} · FAST CLEAR</span><h3>Three fighters. One game plan.</h3></div><span className="pill"><Check size={12}/> OWNED CARDS</span></div><div className="team-grid">{result.team.map((member,i)=>{const def=character(member.character.id);return <article className="fighter-card" key={member.character.id}><div className={`fighter-art art-${i}`}><div className="fighter-monogram">{initials(def?.name||'?')}</div><div className="fighter-watermark"><Swords size={125} strokeWidth={.5}/></div><span className="fighter-position">0{i+1}</span><span className="rarity">{def?.rarity}</span></div><div className="fighter-content"><div className="role-label">{i===0?'STARTING FIGHTER':member.role}</div><h4>{def?.name||member.character.id}</h4><div className="fighter-stats"><span>LV {member.character.level}</span><span>{fusionLabel(member.character.fusion)}</span>{member.character.ascension>0&&<span>A{member.character.ascension}</span>}</div><div className="gear-label">EQUIPMENT</div><ul className="gear-list">{member.gear.map(g=><li key={g.id}><Shield size={14}/><span>{gear(g.id)?.name||g.id}</span><small>{fusionLabel(g.fusion)}</small></li>)}{!member.gear.length&&<li className="muted">No supported equipment available.</li>}</ul><div className="fighter-reasons">{member.reasons.map((r,j)=><p key={j}>{r}</p>)}</div></div></article>;})}</div><div className="result-notes panel"><div><h4><Sparkles size={16}/> Why this lineup</h4>{result.explanation.map((s,i)=><p key={i}>{s}</p>)}</div><div><h4><Crosshair size={16}/> Your opening play</h4><ol>{result.rotation.map((s,i)=><li key={i}>{s}</li>)}</ol></div></div>{result.kameo&&<div className="panel kameo-line"><Zap size={18}/><strong>Kameo: {character(result.kameo.id)?.name}</strong><span>LV {result.kameo.level} · {fusionLabel(result.kameo.fusion)}</span></div>}{result.talentAdvice&&<details className="panel talent-advice"><summary><Settings2 size={17}/> Talent suggestions <ChevronDown size={14}/></summary>{result.talentAdvice.map((tip,i)=><p key={i}>{tip}</p>)}{result.talentNotes&&<div className="saved-talent-notes"><strong>Your saved setup</strong><p>{result.talentNotes}</p></div>}<small>Suggestions are conditional on unlocks and available points, not a point-by-point preset.</small></details>}{result.warnings.length>0&&<details className="result-caveats"><summary>Things to keep in mind <ChevronDown size={14}/></summary>{result.warnings.map((w,i)=><p key={i}>{w}</p>)}</details>}</section>;
}

function CollectionPage({collection,saving,persist,notify,fail,download,exitDemo}:{collection:Collection;saving:boolean;persist:(c:Collection)=>Promise<boolean>;notify:(s:string)=>void;fail:(s:string)=>void;download:()=>void;exitDemo:()=>void}) {
  const [kind,setKind] = useState<Kind>('character');
  const [query,setQuery] = useState('');
  const [drafts,setDrafts] = useState<Draft[]>([]);
  const [busy,setBusy] = useState(false);
  const [progress,setProgress] = useState(0);
  const [status,setStatus] = useState('');
  const [incoming,setIncoming] = useState<Collection|null>(null);
  const [overwrite,setOverwrite] = useState(false);
  const [talents,setTalents] = useState(collection.talents);
  const [unsupported,setUnsupported] = useState('');
  const [deleteTarget,setDeleteTarget] = useState<{id:string;name:string}|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const backupRef=useRef<HTMLInputElement>(null);
  const draftRef=useRef<HTMLDivElement>(null);
  useEffect(()=>setTalents(collection.talents),[collection.talents]);
  const addManual=()=>{exitDemo();setDrafts(d=>[newDraft(kind),...d]);setTimeout(()=>draftRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),40);};
  const screenshots=async(files:FileList|null)=>{
    if(!files?.length)return;exitDemo();setBusy(true);fail('');
    let count=0;
    for(const file of Array.from(files).slice(0,12)){
      try {
        setStatus(`Reading ${file.name}`);setProgress(0);
        const result=await recognizeScreenshot(file,kind,(p,s)=>{setProgress(p);setStatus(`${file.name} · ${s}`);});
        setDrafts(prev=>[...prev,...result.drafts.map(d=>({...newDraft(kind),...d,key:crypto.randomUUID()}))]);count++;
      } catch(e){fail(`${file.name}: ${asError(e)}`);}
    }
    setBusy(false);if(count)notify(`${count} screenshot${count===1?'':'s'} read. Review each card before saving.`);
    setTimeout(()=>draftRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),50);
  };
  const saveDraft=async(d:Draft)=>{
    if(!d.id || d.fusion===null || (d.kind!=='gear'&&d.level===null)){fail('Choose a card and enter its level and fusion before saving.');return;}
    let next={...collection};
    if(d.kind==='character'){
      if(d.ascension===null){fail('Confirm ascension before saving this fighter.');return;}
      const c:OwnedCharacter={id:d.id,level:d.level!,fusion:d.fusion,ascension:d.ascension??0,available:d.available};
      if(d.passive)c.passive=Number(d.passive);if(d.sp1)c.sp1=Number(d.sp1);if(d.sp2)c.sp2=Number(d.sp2);
      const problems=validateCharacter(c);if(problems.length){fail(problems.join(' '));return;}
      next={...collection,characters:[...collection.characters.filter(x=>x.id!==d.id),c]};
    }else if(d.kind==='gear') next={...collection,gear:[...collection.gear.filter(x=>x.id!==d.id),{id:d.id,fusion:d.fusion}]};
    else next={...collection,kameos:[...collection.kameos.filter(x=>x.id!==d.id),{id:d.id,level:d.level!,fusion:d.fusion,available:d.available,...(d.attack1Effect?{attack1Effect:d.attack1Effect}:{}),...(d.attack2Effect?{attack2Effect:d.attack2Effect}:{})}]};
    if(await persist(next)){setDrafts(prev=>prev.filter(x=>x.key!==d.key));notify('Card saved to your collection.');}
  };
  const edit=(id:string)=>{
    const d=newDraft(kind);d.id=id;d.name=(kind==='gear'?gear(id):character(id))?.name||id;
    if(kind==='character'){const c=collection.characters.find(c=>c.id===id)!;Object.assign(d,c,{passive:c.passive?.toString()||'',sp1:c.sp1?.toString()||'',sp2:c.sp2?.toString()||''});}
    if(kind==='gear')Object.assign(d,collection.gear.find(c=>c.id===id));
    if(kind==='kameo')Object.assign(d,collection.kameos.find(c=>c.id===id));
    setDrafts(prev=>[d,...prev]);setTimeout(()=>draftRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),40);
  };
  const remove=async()=>{
    if(!deleteTarget)return;const id=deleteTarget.id;
    const next=kind==='character'?{...collection,characters:collection.characters.filter(c=>c.id!==id)}:kind==='gear'?{...collection,gear:collection.gear.filter(c=>c.id!==id)}:{...collection,kameos:collection.kameos.filter(c=>c.id!==id)};
    if(await persist(next)){setDeleteTarget(null);notify('Card removed.');}
  };
  const entries = (kind==='character'?collection.characters:kind==='gear'?collection.gear:collection.kameos).filter(c=>((kind==='gear'?gear(c.id):character(c.id))?.name||c.id).toLowerCase().includes(query.toLowerCase()));
  const existing=(d:Draft)=>(d.kind==='character'?collection.characters:d.kind==='gear'?collection.gear:collection.kameos).some(c=>c.id===d.id);
  return <section className="collection-page"><div className="eyebrow">THE CARDS IN YOUR CORNER</div><div className="collection-heading"><div><h1>My collection.</h1><p className="lead">Build it once. Keep making it stronger.</p></div><div className="button-row"><button className="icon-button" title="Export collection backup" aria-label="Export collection backup" onClick={download}><ArrowDownToLine size={19}/></button><button className="icon-button" title="Import collection backup" aria-label="Import collection backup" onClick={()=>backupRef.current?.click()}><ArrowUpFromLine size={19}/></button></div></div>
    <input ref={backupRef} type="file" hidden accept="application/json,.json" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>2*1024*1024){fail('Choose a collection backup smaller than 2 MB.');return;}try{setIncoming(parseBackup(await file.text()));setOverwrite(false);}catch(err){fail(`Backup could not be read: ${asError(err)}`);}}}/>
    {incoming&&<div className="panel import-preview"><h3>Review backup import</h3><p>{incoming.characters.length} fighters · {incoming.gear.length} equipment cards · {incoming.kameos.length} Kameos</p><p>New cards will be added. Existing cards stay unchanged unless you choose to update them.</p><label className="check-label"><input type="checkbox" checked={overwrite} onChange={e=>setOverwrite(e.target.checked)}/> Replace matching cards and talent notes with this backup</label><div className="button-row"><button className="primary" disabled={saving} onClick={async()=>{if(await persist(mergeCollections(collection,incoming,overwrite))){setIncoming(null);exitDemo();notify('Backup imported.');}}}>Confirm import</button><button className="secondary" onClick={()=>setIncoming(null)}>Cancel</button></div></div>}
    <div className="collection-tabs">{([{kind:'character',label:'Fighters',count:collection.characters.length},{kind:'gear',label:'Equipment',count:collection.gear.length},{kind:'kameo',label:'Kameos',count:collection.kameos.length}] as const).map(t=><button key={t.kind} className={kind===t.kind?'active':''} onClick={()=>setKind(t.kind)}>{t.label}<span>{t.count}</span></button>)}</div>
    <section className="upload-panel"><div className="upload-icon"><Upload size={23}/></div><div><h3>From screenshot to collection.</h3><p>Upload your {kind==='gear'?'equipment':kind==='kameo'?'Kameo':'fighter'} screenshots, then review the details.</p><small>PNG, JPG or WebP · Up to 12 at a time · Processed on your device</small></div><button className="primary" disabled={busy} onClick={()=>fileRef.current?.click()}>{busy?<LoaderCircle size={16} className="spin"/>:<Plus size={17}/>} Add screenshots</button><input type="file" ref={fileRef} multiple accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{void screenshots(e.target.files);e.target.value='';}}/></section>
    {busy&&<div className="ocr-progress" role="status"><div><span>{status}</span><strong>{Math.round(progress*100)}%</strong></div><progress max="1" value={progress}/><p>First use loads the recognition files. You can add cards manually if reading fails.</p></div>}
    <div ref={draftRef} className="drafts">{drafts.length>0&&<div className="section-title"><h2>Review your cards <span className="pill">{drafts.length} DRAFT{drafts.length===1?'':'S'}</span></h2><button className="text-button" onClick={()=>setDrafts([])}>Discard drafts</button></div>}{drafts.map(d=><DraftEditor key={d.key} draft={d} update={next=>setDrafts(prev=>prev.map(x=>x.key===d.key?next:x))} save={()=>saveDraft(d)} remove={()=>setDrafts(prev=>prev.filter(x=>x.key!==d.key))} saving={saving} existing={existing(d)}/>)}</div>
    <div className="collection-tools"><label className="search"><Search size={17}/><input placeholder={`Search ${kind==='gear'?'equipment':kind==='kameo'?'Kameos':'fighters'}…`} value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search collection"/></label><button className="secondary" onClick={addManual}><Plus size={17}/> Add manually</button></div>
    {!entries.length?<div className="empty panel"><Layers3 size={32}/><h3>{query?'No matching cards':'Your collection starts with one card.'}</h3><p>{query?'Try another name.':'Upload a screenshot or add a card manually. You can update its fusion whenever it changes.'}</p>{!query&&<button className="text-button" onClick={addManual}>Add your first {kind==='gear'?'equipment card':kind==='kameo'?'Kameo':'fighter'} <ArrowRight size={15}/></button>}</div>:<div className="collection-grid">{entries.map(c=>{const def=kind==='gear'?gear(c.id):character(c.id);return <article className="owned-card panel" key={c.id}><div className={`mini-art ${kind==='gear'?'equipment-art':''}`}>{kind==='gear'?<Shield size={23}/>:initials(def?.name||c.id)}</div><div className="owned-info"><h3>{def?.name||c.id}</h3><p>{'level' in c&&`LV ${c.level} · `}{fusionLabel(c.fusion)}{'ascension' in c&&typeof c.ascension==='number'&&c.ascension>0&&` · A${c.ascension}`}</p>{!def&&<span className="unsupported-badge">Not in supported catalog</span>}{'available' in c&&<label className="availability"><input type="checkbox" checked={Boolean(c.available)} disabled={saving} onChange={async e=>{const available=e.target.checked;await persist(kind==='character'?{...collection,characters:collection.characters.map(x=>x.id===c.id?{...x,available}:x)}:{...collection,kameos:collection.kameos.map(x=>x.id===c.id?{...x,available}:x)});}}/>{c.available?'Available':'Unavailable / fatigued'}</label>}</div><div className="card-actions"><button aria-label={`Edit ${def?.name||c.id}`} onClick={()=>edit(c.id)}><Pencil size={15}/></button><button aria-label={`Remove ${def?.name||c.id}`} onClick={()=>setDeleteTarget({id:c.id,name:def?.name||c.id})}><Trash2 size={15}/></button></div></article>;})}</div>}
    {deleteTarget&&<div className="modal-backdrop" onClick={()=>setDeleteTarget(null)}><div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="modal panel" onClick={e=>e.stopPropagation()}><h3 id="delete-title">Remove {deleteTarget.name}?</h3><p>This removes the card from your companion collection.</p><div className="button-row"><button className="danger-button" disabled={saving} onClick={remove}>Remove card</button><button className="secondary" autoFocus onClick={()=>setDeleteTarget(null)}>Keep card</button></div></div></div>}
    <details className="panel extra-panel"><summary><CircleHelp size={18}/> Can’t find a card in the catalog?<ChevronDown size={16}/></summary><p>Track its exact name here. It stays visible, but won’t be scored until its mechanics are supported.</p><div className="button-row"><input aria-label="Unsupported card name" placeholder="Exact character variant or equipment name" maxLength={150} value={unsupported} onChange={e=>setUnsupported(e.target.value)}/><button className="secondary" disabled={!unsupported.trim()||saving} onClick={async()=>{const name=unsupported.trim();if(await persist({...collection,unknownCards:[...new Set([...collection.unknownCards,name])]}))setUnsupported('');}}>Track card</button></div>{collection.unknownCards.map(name=><div className="unknown-card" key={name}><span>{name}</span><span className="pill">NOT SCORED</span><button aria-label={`Remove unsupported ${name}`} disabled={saving} onClick={()=>persist({...collection,unknownCards:collection.unknownCards.filter(n=>n!==name)})}><X size={15}/></button></div>)}</details>
    <details className="panel extra-panel"><summary><Settings2 size={18}/> My talent setup <span className="muted">optional</span><ChevronDown size={16}/></summary><p>Keep your talent names and point allocations here for reference. These notes are included with your saved collection; unverified bonuses are not added to team scores.</p><textarea value={talents} maxLength={5000} rows={4} onChange={e=>setTalents(e.target.value)} placeholder="For example: talent names and points from your current preset…" aria-label="My talent setup"/><button className="secondary" disabled={saving||talents===collection.talents} onClick={async()=>{if(await persist({...collection,talents}))notify('Talent notes saved.');}}>Save talent notes</button></details>
  </section>;
}

function DraftEditor({draft:d,update,save,remove,saving,existing}:{draft:Draft;update:(d:Draft)=>void;save:()=>void;remove:()=>void;saving:boolean;existing:boolean}) {
  const [search,setSearch]=useState('');
  const catalog=d.kind==='gear'?GEARS:CHARACTERS.filter(c=>d.kind!=='kameo'||c.rarity==='gold'||c.rarity==='diamond');
  const filtered=catalog.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.id===d.id);
  const def=d.id?character(d.id):undefined;
  return <article className="draft-card panel"><div className="draft-heading"><span className="pill">{d.kind.toUpperCase()} · REVIEW</span><button aria-label="Discard this draft" onClick={remove}><X size={17}/></button></div><div className="draft-fields"><label>Find card<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter catalog by name"/></label><label>Exact card<select aria-label="Exact card" value={d.id||''} onChange={e=>update({...d,id:e.target.value||null,name:catalog.find(c=>c.id===e.target.value)?.name||'',ascension:0})}><option value="">Choose a supported card…</option>{filtered.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><div className="draft-numbers">{d.kind!=='gear'&&<label>Level<input type="number" inputMode="numeric" min="1" max="60" value={d.level??''} placeholder="Required" onChange={e=>update({...d,level:e.target.value===''?null:Number(e.target.value)})}/></label>}<label>Fusion<select aria-label="Fusion" value={d.fusion??''} onChange={e=>update({...d,fusion:e.target.value===''?null:Number(e.target.value)})}><option value="">Choose…</option>{Array.from({length:11},(_,i)=><option key={i} value={i}>{fusionLabel(i)}{i===0?' · Unfused':''}</option>)}</select></label>{d.kind==='character'&&<label>Ascension<select aria-label="Ascension" value={d.ascension??''} onChange={e=>update({...d,ascension:e.target.value===''?null:Number(e.target.value)})}><option value="">Confirm ascension…</option><option value="0">Not ascended</option>{Array.from({length:def?.stage2?10:def?.stage1?5:0},(_,i)=><option key={i} value={i+1}>{i<5?'Stage I':'Stage II'} · rank {i<5?i+1:i-4}</option>)}</select></label>}</div>{d.kind==='kameo'&&<div className="draft-fields">{(['attack1Effect','attack2Effect'] as const).map(field=><label key={field}>{field==='attack1Effect'?'Attack 1 effect':'Attack 2 effect'} (optional)<select value={d[field]} onChange={e=>update({...d,[field]:e.target.value})}><option value="">Unknown / not entered</option>{KAMEO_EFFECTS.map(effect=><option key={effect}>{effect}</option>)}</select></label>)}</div>}{d.kind==='character'&&<details className="upgrade-details"><summary>Specials & passive upgrades <span>optional</span></summary><div className="draft-numbers">{(['passive','sp1','sp2'] as const).map(field=><label key={field}>{field==='passive'?'Passive level':field==='sp1'?'Special 1 level':'Special 2 level'}<input type="number" inputMode="numeric" min="1" max={field==='passive'?3:10} value={d[field]} placeholder="Unknown" onChange={e=>update({...d,[field]:e.target.value})}/></label>)}</div></details>}{d.kind!=='gear'&&<label className="check-label"><input type="checkbox" checked={d.available} onChange={e=>update({...d,available:e.target.checked})}/> Available to use</label>}{d.raw&&<details className="raw-text"><summary>Recognised screenshot text</summary><pre>{d.raw}</pre></details>}{existing&&<p className="duplicate-warning">Already in your collection. Saving will update this card with the reviewed values.</p>}<div className="draft-save"><span>Check the details against your game.</span><button className="primary" disabled={saving||!d.id||d.fusion===null||(d.kind!=='gear'&&d.level===null)||(d.kind==='character'&&d.ascension===null)} onClick={save}><Check size={16}/>{existing?'Update card':'Save card'}</button></div></article>;
}
