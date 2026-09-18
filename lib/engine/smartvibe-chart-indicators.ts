import type { MarketCandle } from '@/lib/backend';

export type PlotLine={name:string;value:number;kind?:'solid'|'dashed'|'dotted';tone?:'red'|'green'|'orange'|'cyan'|'purple'|'yellow'|'blue'|'magenta'|'white'};
export type Zone={left:number;right:number;top:number;bottom:number;dir:'bull'|'bear';label:string;alpha?:number};
export type Marker={index:number;price:number;dir:'buy'|'sell'|'info';label:string};
export type IndicatorSnapshot={
  emaLines:{name:string;values:(number|null)[];tone:string}[];
  smaLines:{name:string;values:(number|null)[];tone:string}[];
  levels:PlotLine[];
  zones:Zone[];
  markers:Marker[];
  sessionLines:{name:string;start:number;end:number;high:number;low:number;tone:PlotLine['tone']}[];
  htfCandles:{left:number;right:number;open:number;high:number;low:number;close:number}[];
  tradePlan?:{direction:'BUY'|'SELL';entry:number;sl:number;tps:number[]};
  dashboards:Array<{title:string;rows:[string,string][]}>;
};

const n=(v:number)=>Number.isFinite(v);
const ema=(xs:number[],len:number):(number|null)[]=>{
  const out:(number|null)[]=Array(xs.length).fill(null); if(xs.length<len)return out;
  let s=xs.slice(0,len).reduce((a,b)=>a+b,0)/len; out[len-1]=s; const k=2/(len+1);
  for(let i=len;i<xs.length;i++){s=xs[i]*k+s*(1-k);out[i]=s;} return out;
};
const sma=(xs:number[],len:number):(number|null)[]=>{
  const out:(number|null)[]=Array(xs.length).fill(null); let sum=0;
  for(let i=0;i<xs.length;i++){sum+=xs[i];if(i>=len)sum-=xs[i-len];if(i>=len-1)out[i]=sum/len;}return out;
};
const atr=(bars:MarketCandle[],len=14)=>
  sma(bars.map((b,i)=>i?Math.max(b.high-b.low,Math.abs(b.high-bars[i-1].close),Math.abs(b.low-bars[i-1].close)):b.high-b.low),len);
const dayKey=(t:number)=>new Date(t).toISOString().slice(0,10);
const weekKey=(t:number)=>{const d=new Date(t);const day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day);return d.toISOString().slice(0,10)};
const group=(bars:MarketCandle[],key:(t:number)=>string)=>{
  const m=new Map<string,{start:number;end:number;open:number;high:number;low:number;close:number}>();
  bars.forEach((b,i)=>{const t=Date.parse(b.time),k=key(t),g=m.get(k);if(!g)m.set(k,{start:i,end:i,open:b.open,high:b.high,low:b.low,close:b.close});else{g.end=i;g.high=Math.max(g.high,b.high);g.low=Math.min(g.low,b.low);g.close=b.close;}});
  return [...m.values()];
};
const toneColor=(tone:string)=>({red:'#ef4444',green:'#22c55e',orange:'#f59e0b',cyan:'#06b6d4',purple:'#a855f7',yellow:'#eab308',blue:'#3b82f6',magenta:'#ec4899',white:'#e5e7eb'} as Record<string,string>)[tone]??'#94a3b8';

export function calculateSmartVibeIndicators(input:MarketCandle[]):IndicatorSnapshot{
  const bars=input.slice(-240); const closes=bars.map(b=>b.close), highs=bars.map(b=>b.high), lows=bars.map(b=>b.low);
  const levels:PlotLine[]=[]; const zones:Zone[]=[]; const markers:Marker[]=[]; const sessionLines:IndicatorSnapshot['sessionLines']=[];
  const emaLens=[5,11,15,18,21,24,28,34,200];
  const emaLines=emaLens.map((len,i)=>({name:`EMA ${len}`,values:ema(closes,len),tone:i===8?'purple':i<2?'cyan':'blue'}));
  const smaLines=[7,14].map((len,i)=>({name:`SMA ${len}`,values:sma(closes,len),tone:i?'yellow':'white'}));

  const days=group(bars,dayKey), weeks=group(bars,weekKey);
  const lastDay=days.at(-1), prevDay=days.at(-2), prevWeek=weeks.at(-2);
  if(prevDay){levels.push({name:'PDH',value:prevDay.high,tone:'red'},{name:'PDL',value:prevDay.low,tone:'green'},{name:'PDO',value:prevDay.open,tone:'orange'},{name:'PDC',value:prevDay.close,tone:'orange'});}
  if(prevWeek)levels.push({name:'PWH',value:prevWeek.high,tone:'orange'},{name:'PWL',value:prevWeek.low,tone:'cyan'});

  const sessionDefs=[['Asia',0,8,'blue'],['London',7,11,'purple'],['New York',13,17,'yellow']] as const;
  for(const [name,startHour,endHour,tone] of sessionDefs){
    let cur:any=null;
    bars.forEach((b,i)=>{const d=new Date(Date.parse(b.time));const h=d.getUTCHours()+d.getUTCMinutes()/60;const inS=h>=startHour&&h<endHour;
      if(inS&&!cur)cur={name,start:i,end:i,high:b.high,low:b.low,tone};
      else if(inS&&cur){cur.end=i;cur.high=Math.max(cur.high,b.high);cur.low=Math.min(cur.low,b.low);}
      else if(!inS&&cur){sessionLines.push(cur);cur=null;}
    }); if(cur)sessionLines.push(cur);
  }

  if(prevDay&&lastDay){
    const pdInside=lastDay.high<prevDay.high&&lastDay.low>prevDay.low;
    const last=bars.at(-1)!;
    if(pdInside)markers.push({index:bars.length-1,price:last.high,dir:'info',label:'SV ID'});
    if(last.high>prevDay.high&&last.close<prevDay.high)markers.push({index:bars.length-1,price:last.high,dir:'sell',label:'SV SELL'});
    if(last.low<prevDay.low&&last.close>prevDay.low)markers.push({index:bars.length-1,price:last.low,dir:'buy',label:'SV BUY'});
  }
  if(days.length>=3){
    const d1=days.at(-2)!,d2=days.at(-3)!,last=bars.at(-1)!;
    if(d2.close<d2.open&&d1.close<d1.open&&last.close>last.open)markers.push({index:bars.length-1,price:last.low,dir:'buy',label:'SV 3D BUY'});
    if(d2.close>d2.open&&d1.close>d1.open&&last.close<last.open)markers.push({index:bars.length-1,price:last.high,dir:'sell',label:'SV 3D SELL'});
  }

  const a=atr(bars,14);
  for(let i=2;i<bars.length;i++){
    const atrv=a[i]??0;
    if(atrv>0){
      if(bars[i].low>bars[i-2].high)zones.push({left:i-2,right:Math.min(bars.length-1,i+18),top:bars[i].low,bottom:bars[i-2].high,dir:'bull',label:'FVG'});
      if(bars[i].high<bars[i-2].low)zones.push({left:i-2,right:Math.min(bars.length-1,i+18),top:bars[i-2].low,bottom:bars[i].high,dir:'bear',label:'FVG'});
      const bull=bars[i].close>bars[i].open&&(bars[i].close-bars[i].open)>=atrv;
      const bear=bars[i].close<bars[i].open&&(bars[i].open-bars[i].close)>=atrv;
      if(bull&&bars[i-1].close<bars[i-1].open)zones.push({left:i-1,right:Math.min(bars.length-1,i+15),top:bars[i-1].high,bottom:bars[i-1].low,dir:'bull',label:'SV BULL OB'});
      if(bear&&bars[i-1].close>bars[i-1].open)zones.push({left:i-1,right:Math.min(bars.length-1,i+15),top:bars[i-1].high,bottom:bars[i-1].low,dir:'bear',label:'SV BEAR OB'});
    }
  }

  const vol=bars.map(b=>(b as any).volume??0), volBase=sma(vol,30);
  const beams:{value:number;dir:'bull'|'bear';strength:number}[]=[];
  for(let i=14;i<bars.length;i++){
    const av=a[i]??0,vr=volBase[i]&&volBase[i]>0?vol[i]/volBase[i]:0;
    const range=bars[i].high-bars[i].low, rr=av>0?range/av:0;
    const trigger=vr>=2 || rr>=2;
    if(trigger&&av>0){const s=Math.max(vr,rr); beams.push({value:bars[i].close-av*.5,dir:'bull',strength:s},{value:bars[i].close+av*.5,dir:'bear',strength:s});}
  }
  beams.slice(-12).forEach(b=>levels.push({name:b.dir==='bull'?'LONG LIQ':'SHORT LIQ',value:b.value,tone:b.dir==='bull'?'green':'red',kind:'dotted'}));

  // SMARTVIBE AI-BOT: EMA 11/34 crossover, ATR SL and four TP levels.
  let tradePlan:IndicatorSnapshot['tradePlan'];
  for(let i=1;i<bars.length;i++){
    const e11=emaLines[1].values[i],p11=emaLines[1].values[i-1],e34=emaLines[7].values[i],p34=emaLines[7].values[i-1];
    if(e11!==null&&e34!==null&&p11!==null&&p34!==null){
      if(p11<=p34&&e11>e34)markers.push({index:i,price:bars[i].low,dir:'buy',label:'SMARTVIBE BUY'});
      if(p11>=p34&&e11<e34)markers.push({index:i,price:bars[i].high,dir:'sell',label:'SMARTVIBE SELL'});
    }
  }
  const e11=emaLines[1].values.at(-1),e34=emaLines[7].values.at(-1),av=a.at(-1)??null;
  const recentCross=markers.filter(m=>m.label==='SMARTVIBE BUY'||m.label==='SMARTVIBE SELL').at(-1);
  if(recentCross&&av&&e11!==null&&e34!==null){
    const dir=recentCross.dir==='buy'?'BUY':'SELL',entry=bars[recentCross.index].close,sl=entry+(dir==='BUY'?-1:1)*av*2;
    tradePlan={direction:dir,entry,sl,tps:[1,2,3,4].map(x=>entry+(dir==='BUY'?1:-1)*av*2*x)};
    levels.push({name:'ENTRY',value:entry,tone:'cyan',kind:'solid'},{name:'SL',value:sl,tone:'red',kind:'solid'});
    tradePlan.tps.forEach((v,i)=>levels.push({name:`TP${i+1}`,value:v,tone:'green',kind:'dashed'}));
  }

  // 4H HTF projection: aggregate the supplied live candles into UTC 4-hour buckets.
  const buckets=new Map<number,{left:number;right:number;open:number;high:number;low:number;close:number}>();
  bars.forEach((b,i)=>{const t=Date.parse(b.time),k=Math.floor(t/14400000)*14400000,g=buckets.get(k);if(!g)buckets.set(k,{left:i,right:i,open:b.open,high:b.high,low:b.low,close:b.close});else{g.right=i;g.high=Math.max(g.high,b.high);g.low=Math.min(g.low,b.low);g.close=b.close;}});
  const htfCandles=[...buckets.values()].slice(-8);

  const ib=bars.filter(b=>{const d=new Date(Date.parse(b.time));const h=d.getUTCHours()+d.getUTCMinutes()/60;return h>=13.5&&h<14.5;});
  if(ib.length){const ih=Math.max(...ib.map(x=>x.high)),il=Math.min(...ib.map(x=>x.low));levels.push({name:'IBH',value:ih,tone:'blue',kind:'solid'},{name:'IBL',value:il,tone:'blue',kind:'solid'},{name:'IBM',value:(ih+il)/2,tone:'white',kind:'dashed'});}

  const lastE11=e11??0,lastE34=e34??0;
  const dashboards:IndicatorSnapshot['dashboards']=[
    {title:'SMARTVIBE AI-BOT SYSTEM',rows:[['Signal',tradePlan?.direction??'WAIT'],['EMA 11 / 34',lastE11>lastE34?'BULLISH':'BEARISH'],['EMA 200',(emaLines[8].values.at(-1)??0)<closes.at(-1)!?'ABOVE':'BELOW'],['Authority','SMARTVIBE']]},
    {title:'SMARTVIBE PRO',rows:[['PDH',prevDay?prevDay.high.toString():'—'],['PDL',prevDay?prevDay.low.toString():'—'],['Signals',String(markers.filter(x=>x.dir!=='info').length)],['Methodology','PRIMARY AUTHORITY']]},
  ];
  return {emaLines,smaLines,levels,zones:zones.slice(-80),markers:markers.slice(-80),sessionLines,htfCandles,tradePlan,dashboards};
}

export {toneColor};
