import {collectionRects,levelValue,romanValue,type GridRect} from './grid';
import {FIGHTER_NAMES,EQUIPMENT_NAMES} from './recognition-names';
import {CHARACTERS,GEARS} from './game';
import type {OCRDraft} from './ocr';
import {PSM,type Worker} from 'tesseract.js';
const norm=(s:string)=>s.toLowerCase().replace(/\([^)]*\)/g,'').replace(/[^a-z0-9]/g,'').replace(/mkiimovie/g,'mk11movie');
export function matchGridName(text:string,kind:OCRDraft['kind']) {
 const catalog=kind==='gear'?GEARS:CHARACTERS;
 const names=[...new Map([...catalog.map(c=>c.name),...(kind==='gear'?EQUIPMENT_NAMES:FIGHTER_NAMES)].map(name=>[norm(name),name])).values()];
 // Tesseract commonly reads the MK11 label as MKII, MKI1 or MKI11. Collapse the
 // whole noisy numeral instead of replacing only its first two characters.
 const cleaned=text.replace(/MK\s*[Ii1l]{2,3}/gi,'MK11').replace(/MK\s*[Ii1l]\b/gi,'MK1');
 const n=norm(cleaned);
 // A base name alone cannot establish which fighter variant is pictured.
 const eligible=names.filter(name=>kind==='gear'||!names.some(other=>other!==name&&norm(other).endsWith(norm(name))));
 const contained=eligible.filter(name=>n.includes(norm(name))).sort((a,b)=>norm(b).length-norm(a).length);
 const exact=contained.length===1?contained[0]:null;
 const distance=(a:string,b:string)=>{let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const next=[i+1];for(let j=0;j<b.length;j++)next[j+1]=Math.min(next[j]+1,row[j+1]+1,row[j]+(a[i]===b[j]?0:1));row=next;}return row[b.length];};
 const ranked=eligible.map(name=>({name,score:distance(n,norm(name))/Math.max(n.length,norm(name).length)})).sort((a,b)=>a.score-b.score);
 const best=ranked[0];
 const fuzzy=best&&best.score<.20&&(!ranked[1]||ranked[1].score-best.score>.08)?best.name:null;
 const recognized=exact??fuzzy;
 const name=recognized??text.split('\n').map(s=>s.trim()).filter(Boolean).join(' ').replace(/\s+/g,' ');
 const known=recognized?catalog.find(c=>norm(c.name)===norm(name)):null;
 return {id:known?.id??null,name,recognized:Boolean(recognized)};
}
export async function readCollectionGrid(img:HTMLImageElement,worker:Worker,progress:(n:number,s:string)=>void,hint:OCRDraft['kind']|'auto'='auto'):Promise<OCRDraft[]|null>{
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=Math.round(img.naturalHeight*2048/img.naturalWidth);
 const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(img,0,0,canvas.width,canvas.height);
 const rects=collectionRects(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
 if(rects.length<8)return null;
 const original=document.createElement('canvas');original.width=img.naturalWidth;original.height=img.naturalHeight;original.getContext('2d')!.drawImage(img,0,0);
 const scale=img.naturalWidth/canvas.width;
 const crop=(r:GridRect,x:number,y:number,w:number,h:number,style:'color'|'light'|'dark'='color')=>{
  const c=document.createElement('canvas');c.width=Math.round(r.width*w*3)+24;c.height=Math.round(r.height*h*3)+24;
  const p=c.getContext('2d',{willReadFrequently:true})!;p.fillStyle=style==='color'?'black':'white';p.fillRect(0,0,c.width,c.height);
  p.drawImage(original,(r.x+r.width*x)*scale,(r.y+r.height*y)*scale,r.width*w*scale,r.height*h*scale,12,12,c.width-24,c.height-24);
  if(style!=='color'){
   const data=p.getImageData(12,12,c.width-24,c.height-24);
   for(let i=0;i<data.data.length;i+=4){const a=data.data[i],b=data.data[i+1],d=data.data[i+2];const ink=style==='light'?Math.min(a,b,d)>155:Math.max(a,b,d)<100;data.data[i]=data.data[i+1]=data.data[i+2]=ink?0:255;}
   p.putImageData(data,12,12);
  }
  return c;
 };
 const read=async(c:HTMLCanvasElement,digits=false)=>{
  await worker.setParameters({user_defined_dpi:'300',tessedit_pageseg_mode:digits?PSM.SINGLE_LINE:PSM.SINGLE_BLOCK,tessedit_char_whitelist:digits?'0123456789':''});
  return (await worker.recognize(c)).data;
 };
 const footers=[];
 progress(0,'Identifying card type');
 for(const r of rects)footers.push((await read(crop(r,.06,.865,.88,.12))).text);
 const gearScreen=footers.filter(t=>/WEAPON|ARMOR|ACCESSORY/i.test(t)).length>rects.length/3;
 let kameoScreen=hint==='kameo'||footers.filter(t=>/KAM[E3][O0]/i.test(t.replace(/\s/g,''))).length>=2;
 if(!gearScreen&&!kameoScreen){
  for(const r of rects.slice(0,4)){const footer=await read(crop(r,.15,.88,.7,.08,'dark'));if(/KAM[E3][O0]/i.test(footer.text.replace(/\s/g,''))){kameoScreen=true;break;}}
 }
 const drafts:OCRDraft[]=[];
 for(let i=0;i<rects.length;i++){
  const r=rects[i];progress(i/rects.length,`Reading card ${i+1} of ${rects.length}`);
  const gear=gearScreen,kameo=kameoScreen;
  const kind:OCRDraft['kind']=gear?'gear':kameo?'kameo':'character';
  const name=await read(crop(r,.045,gear?.12:.51,.91,gear?.21:kameo?.17:.25));
  let level=await read(crop(r,gear?.56:.365,gear?.75:kameo?.67:.735,gear?.20:.28,gear?.11:.105,'light'),true);
  if(!gear&&levelValue(level.text)===null)level=await read(crop(r,.365,kameo?.67:.735,.28,.105),true);
  await worker.setParameters({user_defined_dpi:'300',tessedit_pageseg_mode:PSM.SINGLE_LINE,tessedit_char_whitelist:'IVX'});
  const fusionText=(await worker.recognize(crop(r,.405,.012,.19,.06,'dark'))).data.text;
  // A missing number may be a locked card or unreadable text. Keep a review draft; never infer ownership.
  const power=level.text.trim();
  const readableNumber=gear ? /^\d{1,2}$/.test(power)&&Number(power)>=5&&Number(power)<=50 : levelValue(level.text)!==null;
  let identity=matchGridName(name.text,kind);
  let extraText='';
  if(!identity.recognized){
   const contrast=await read(crop(r,.045,gear?.12:.54,.91,gear?.21:kameo?.16:.21,'light'));
   extraText=contrast.text;const alternate=matchGridName(contrast.text,kind);if(alternate.recognized)identity=alternate;
  }
  if(!identity.name)identity.name='Unreadable card';
  const reviewNote=readableNumber?'Confirm fusion against the card image.':'No readable level or power. Confirm this card is owned before entering its values.';
  const lv=kind==='gear'?null:levelValue(level.text);
  const fusion=lv!==null&&lv>50?10:romanValue(fusionText);
  const raw=`${name.text}\n${extraText}\nLevel/power region: ${level.text}\nFusion badge: ${fusionText}\n${reviewNote}`;
  drafts.push({...identity,ownedEvidence:readableNumber,kind,level:lv,fusion,ascension:kind==='character'?null:0,raw,thumbnail:crop(r,0,0,1,1).toDataURL('image/jpeg',.65),available:!(/ON\s*QUEST/i.test(name.text+' '+extraText))});
 }
 return drafts.length?drafts:null;
}
