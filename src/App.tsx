import {useEffect,useRef,useState} from 'react';
import {Upload,LoaderCircle,ArrowRight,Check,Shield,Download} from 'lucide-react';
import {CHARACTERS,GEARS,TOWERS,recommend,emptyCollection,type Collection,type Settings} from './game';
import {loadCollection,loadScans,saveScans,parseBackup,mergeCollections,saveCollection} from './storage';
import {recognizeScreenshot} from './ocr';
import {acceptScans,scoringCollection,validateScans,type ScanCard} from './scans';
const defaults:Settings={mode:'tower',tower:TOWERS[0],difficulty:'normal',realmMode:'quick',playStyle:'manual',useKameo:true,fightType:'regular'};
const fighter=(id:string)=>CHARACTERS.find(c=>c.id===id)?.name??id;
const equipment=(id:string)=>GEARS.find(c=>c.id===id)?.name??id;
const message=(e:unknown)=>e instanceof Error?e.message:'Please try again.';
export default function App(){
 const [saved,setSaved]=useState<Collection>(emptyCollection()),[scans,setScans]=useState<ScanCard[]>([]),[ready,setReady]=useState(false);
 const [settings,setSettings]=useState(defaults),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[progress,setProgress]=useState(0),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [results,setResults]=useState<ReturnType<typeof recommend>|null>(null),[option,setOption]=useState(0),[building,setBuilding]=useState(false),[query,setQuery]=useState('');
 const upload=useRef<HTMLInputElement>(null),backup=useRef<HTMLInputElement>(null),lock=useRef(false);
 useEffect(()=>{Promise.all([loadCollection(),loadScans()]).then(([c,s])=>{if(c)setSaved(c);setScans(s);}).catch(e=>setError(`Could not open your saved cards: ${message(e)}`)).finally(()=>setReady(true));},[]);
 useEffect(()=>{setResults(null);setOption(0);},[scans,saved,settings]);
 const data=scoringCollection(scans,saved);
 const count=(kind:ScanCard['kind'])=>new Set([...scans.filter(c=>c.kind===kind).map(c=>c.id??c.name),...(kind==='character'?saved.characters:kind==='gear'?saved.gear:saved.kameos).map(c=>c.id)]).size;
 const read=async(files:File[])=>{
  if(!files.length||lock.current)return;lock.current=true;setBusy(true);setError('');setNotice('');let current=scans,skipped=0,finished=0;const failures:string[]=[];
  try{
   for(const [i,file] of files.slice(0,60).entries()){
    setStatus(`Screenshot ${i+1} of ${Math.min(files.length,60)}`);setProgress(i/files.length);
    try{
     const result=await recognizeScreenshot(file,'auto',(p,s)=>{setProgress((i+p)/Math.min(files.length,60));setStatus(`Screenshot ${i+1} of ${Math.min(files.length,60)} · ${s}`);});
     const merged=acceptScans(current,result.drafts);await saveScans(merged.cards);current=merged.cards;setScans(current);skipped+=merged.skipped;finished++;
    }catch(e){failures.push(`${file.name}: ${message(e)}`);}
   }
   setNotice(`${finished} screenshot${finished===1?'':'s'} read. Your recognized cards are saved automatically.${skipped?` ${skipped} unclear or locked card readings were left out.`:''}`);
   if(failures.length)setError(failures.join(' '));
  }finally{lock.current=false;setBusy(false);setProgress(1);}
 };
 const build=()=>{setBuilding(true);setError('');setTimeout(()=>{try{setResults(recommend(data,settings));setOption(0);}catch(e){setError(message(e));}finally{setBuilding(false);}},40);};
 const download=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:2,collection:saved,scans})],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kombat-collection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
 const restore=async(file?:File)=>{
  if(!file)return;try{if(file.size>2000000)throw Error('Choose a backup smaller than 2 MB.');const text=await file.text(),value=JSON.parse(text);
   if(value.version===2){const incoming=validateScans(value.scans);const old=parseBackup(JSON.stringify({version:1,savedAt:new Date().toISOString(),collection:value.collection}));const combined=mergeCollections(saved,old,false);const merged=[...new Map([...incoming,...scans].map(c=>[`${c.kind}:${c.name}`,c])).values()];await saveScans(merged);setScans(merged);await saveCollection(combined);setSaved(combined);}
   else{const combined=mergeCollections(saved,parseBackup(text),false);await saveCollection(combined);setSaved(combined);}setNotice('Your backup has been added.');
  }catch(e){setError(message(e));}
 };
 const update=async(index:number,change:Partial<ScanCard>)=>{try{const next=scans.map((c,i)=>i===index?{...c,...change}:c);await saveScans(next);setScans(next);}catch(e){setError(message(e));}};
 const result=results?.recommendations[option];
 const covered=scans.filter(c=>c.id).length;
 if(!ready)return <main className="simple"><p>Opening your collection…</p></main>;
 return <div className="simple-shell"><header><strong>Kombat Companion</strong><span>Private · Free</span></header><main className="simple">
  <h1>Your screenshots.<br/>Your next team.</h1><p className="intro">Upload your fighters, gear and Kameos together. Then choose where you’re playing.</p>
  {error&&<p className="error" role="alert">{error}</p>}
  <section className="upload-box"><div><h2>1. Add your screenshots</h2><p>Gallery screenshots work best. Recognized owned cards are saved for you.</p></div><button className="primary" disabled={busy} onClick={()=>upload.current?.click()}>{busy?<LoaderCircle className="spin" size={18}/>:<Upload size={18}/>} {busy?'Reading screenshots…':'Upload screenshots'}</button><input ref={upload} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>{void read(Array.from(e.target.files??[]));e.target.value='';}}/>
  {busy&&<div className="progress" role="status"><span>{status}</span><progress max={1} value={progress}/><small>You can leave this page open while the batch finishes.</small></div>}
  {(count('character')+count('gear')+count('kameo')>0)&&<p className="counts"><Check size={16}/>{count('character')} fighters · {count('gear')} gear · {count('kameo')} Kameos saved</p>}
  {notice&&<p className="notice" role="status">{notice}</p>}</section>
  <section className="destination"><h2>2. Where are you playing?</h2><div className="modes">{(['tower','krypt','realm'] as const).map(mode=><button key={mode} aria-pressed={settings.mode===mode} onClick={()=>setSettings({...settings,mode,difficulty:'normal'})}>{mode==='tower'?'Towers':mode==='krypt'?'Krypt':'Realm Klash'}</button>)}</div>
  <div className="fields">{settings.mode==='tower'&&<><label>Tower<select value={settings.tower} onChange={e=>setSettings({...settings,tower:e.target.value})}>{TOWERS.map(t=><option key={t}>{t}</option>)}</select></label><label>Fight<select value={settings.fightType??'regular'} onChange={e=>setSettings({...settings,fightType:e.target.value as Settings['fightType']})}><option value="regular">Regular floor</option><option value="boss">Boss floor</option></select></label></>}
  {settings.mode==='realm'&&<label>Mode<select value={settings.realmMode} onChange={e=>setSettings({...settings,realmMode:e.target.value as Settings['realmMode']})}><option value="quick">Quick Play</option><option value="survivor">Survivor</option><option value="klash">Klash Tower</option></select></label>}
  {(settings.mode!=='realm'||settings.realmMode==='survivor')&&<label>Difficulty<select value={settings.difficulty} onChange={e=>setSettings({...settings,difficulty:e.target.value})}>{(settings.mode==='tower'?['normal','fatal']:settings.mode==='krypt'?['normal','hard','elder','khaotic']:['easy','normal','hard','fatal','elder']).map(d=><option value={d} key={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}</select></label>}
  <label>Play style<select value={settings.playStyle} onChange={e=>setSettings({...settings,playStyle:e.target.value as Settings['playStyle']})}><option value="manual">Manual</option><option value="auto">Auto-battle</option></select></label></div>
  <button className="primary find" disabled={busy||building||data.characters.filter(c=>c.available).length<3} onClick={build}>{building?<LoaderCircle className="spin" size={18}/>:null}{building?'Finding your team…':'Suggest my team & gear'}<ArrowRight size={18}/></button>
  {data.characters.length<3&&<p className="hint">Upload enough fighter screenshots to recognize at least three supported fighters with readable levels.</p>}</section>
  {results&&<section className="results" aria-live="polite"><div className="result-title"><h2>3. Your suggested team</h2>{results.recommendations.length>1&&<button onClick={()=>setOption((option+1)%results.recommendations.length)}>Another vetted plan →</button>}</div>
  {result?<>{result.planName&&<div className="plan"><strong>{result.planName}</strong><span>{result.bestFor}</span></div>}<div className="team">{result.team.map((member,i)=><article key={member.character.id}><small>{i===0?'STARTING SLOT':member.role}</small><h3>{fighter(member.character.id)}</h3><p className="job">{member.reasons[0]}</p><ul>{member.gear.map(g=><li key={g.id}><Shield size={14}/>{equipment(g.id)}</li>)}</ul>{!member.gear.length&&<p>Upload more gear screenshots to fill this loadout.</p>}</article>)}</div>{result.kameo&&<p className="kameo"><strong>Kameo:</strong> {fighter(result.kameo.id)}</p>}
  <p className="hint">This plan requires a specific team interaction. Unread fusion uses conservative estimates and is not treated as a confirmed upgrade. A Kameo is not selected unless its assist effects are known.</p>
  <details><summary>How to use this team</summary>{result.rotation.map((r,i)=><p key={i}>{r}</p>)}{result.explanation.map((r,i)=><p key={`e${i}`}>{r}</p>)}</details>
  <details><summary>Recommendation limits</summary><p>General mode advice, not a specific boss or modifier solution. This is a strategy estimate, not a measured fastest-team ranking. Missing fusion can change the ranking and gear choices.</p>{[...results.warnings,...result.warnings].map((w,i)=><p key={i}>{w}</p>)}</details></>:<p>No eligible team for this difficulty yet. Try a lower difficulty or add more fighter screenshots.</p>}</section>}
  <details className="collection"><summary>Your saved cards & backups <span>{count('character')+count('gear')+count('kameo')}</span></summary><p>Nothing here needs filling in before getting suggestions. You can correct a reading or add fusion if you want a more accurate comparison.</p>
  <div className="backup"><button disabled={busy} onClick={download}><Download size={15}/> Save backup</button><button disabled={busy} onClick={()=>backup.current?.click()}>Restore backup</button><input ref={backup} hidden type="file" accept=".json" onChange={e=>{void restore(e.target.files?.[0]);e.target.value='';}}/></div>
  <p className="hint">{scans.length?`${covered} of ${scans.length} scanned cards have strategy profiles. Recognized cards without profiles stay saved but are not ranked.`:`${saved.characters.length} previously saved fighters are included.`}</p>
  <input className="search" aria-label="Search saved cards" placeholder="Search your cards" value={query} onChange={e=>setQuery(e.target.value)}/>
  {scans.map((c,index)=>c.name.toLowerCase().includes(query.toLowerCase())&&<details className="saved-card" key={`${c.kind}:${c.name}`}><summary>{c.name}<small>{c.kind==='character'?'Fighter':c.kind==='gear'?'Gear':'Kameo'}{c.level!==null?` · Lv ${c.level}`:''}{!c.id?' · Saved, not ranked':''}</small></summary><div className="fields">{c.kind!=='gear'&&<label>Level<input disabled={busy} type="number" min={1} max={60} value={c.level??''} onChange={e=>void update(index,{level:e.target.value?Number(e.target.value):null})}/></label>}<label>Fusion<select disabled={busy} value={c.fusion??''} onChange={e=>void update(index,{fusion:e.target.value?Number(e.target.value):e.target.value==='0'?0:null})}><option value="">Not read</option>{Array.from({length:11},(_,i)=><option key={i} value={i}>{i===0?'Unfused':`Fusion ${i}`}</option>)}</select></label><label>Available<select disabled={busy} value={c.available?'yes':'no'} onChange={e=>void update(index,{available:e.target.value==='yes'})}><option value="yes">Yes</option><option value="no">No / on quest</option></select></label></div></details>)}
  {saved.characters.filter(c=>fighter(c.id).toLowerCase().includes(query.toLowerCase())).map(c=><p key={c.id}>{fighter(c.id)} · Lv {c.level} · Fusion {c.fusion} · previously saved</p>)}</details>
  <footer>Independent fan companion. Screenshots are read on this device.</footer>
 </main></div>;
}
