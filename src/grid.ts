/** Layout calibration from landscape collection screenshots, not account-specific card data. */
export interface GridRect {x:number;y:number;width:number;height:number}
export function collectionRects(pixels:Uint8ClampedArray,width:number,height:number):GridRect[] {
 if(width/height<2 || width/height>2.3)return [];
 const pitch=height*.221,cardWidth=height*.196;
 const score=new Float64Array(width);
 for(let x=2;x<width-2;x++)for(let y=Math.round(height*.20);y<height*.40;y+=4){
  const a=(y*width+x-2)*4,b=(y*width+x+2)*4;
  score[x]+=(Math.abs(pixels[a]-pixels[b])+Math.abs(pixels[a+1]-pixels[b+1])+Math.abs(pixels[a+2]-pixels[b+2]))/3;
 }
 let phase=0,best=0;
 for(let offset=0;offset<pitch;offset++){
  let value=0;
  for(let x=offset;x+cardWidth<width;x+=pitch)value+=score[Math.round(x)]+score[Math.round(x+cardWidth)];
  if(value>best){best=value;phase=offset;}
 }
 const result:GridRect[]=[];
 for(const y of [height*.130,height*.497])for(let x=phase;x+cardWidth<width-3;x+=pitch){
  // Require both vertical card edges, so blank space is not treated as a card.
  if(score[Math.round(x)]<height*.7 || score[Math.round(x+cardWidth)]<height*.7)continue;
  result.push({x:x-5*height/943,y,width:cardWidth+10*height/943,height:height*.325});
 }
 return result;
}
export function romanValue(text:string):number|null {
 const value=text.trim().toUpperCase().replace(/\s/g,'');
 const values=['0','I','II','III','IV','V','VI','VII','VIII','IX','X'];
 const index=values.indexOf(value);return index<0?null:index;
}
export function levelValue(text:string):number|null {
 const s=text.trim();if(!/^\d{1,2}$/.test(s))return null;
 const n=Number(s);return n>=1&&n<=60?n:null;
}
