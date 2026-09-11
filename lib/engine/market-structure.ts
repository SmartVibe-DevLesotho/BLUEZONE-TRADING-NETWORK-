/** Universal SmartVibe supporting market-structure mechanism. */
export type MarketBar = { t:number; o:number; h:number; l:number; c:number; v?:number };
export type Regime = 'BULLISH_TREND'|'BEARISH_TREND'|'RANGE'|'ACCUMULATION'|'DISTRIBUTION'|'CORRECTION'|'TRANSITION'|'HIGH_VOLATILITY'|'LOW_VOLATILITY'|'UNCERTAIN'|'INSUFFICIENT_DATA';
export type StructureState = 'BULLISH'|'BEARISH'|'RANGE'|'TRANSITION'|'UNCERTAIN'|'INSUFFICIENT_DATA';
export type LiquidityState = 'NONE'|'PREVIOUS_HIGH_SWEEP'|'PREVIOUS_LOW_SWEEP'|'EQUAL_HIGH_SWEEP'|'EQUAL_LOW_SWEEP'|'REJECTION'|'ACCEPTANCE'|'FAILED_SWEEP'|'CONFIRMED_STRUCTURAL_REVERSAL'|'UNCONFIRMED';
export type RangePosition = 'LOWER_EXTREME'|'LOWER_QUARTILE'|'MID_RANGE'|'UPPER_QUARTILE'|'UPPER_EXTREME'|'UNDEFINED';
export type TrendTransition = 'EARLY_TRANSITION'|'POSSIBLE_TREND_FLIP'|'CONFIRMED_TREND_FLIP'|'FAILED_TREND_FLIP'|'NO_STRUCTURAL_CHANGE'|'UNCERTAIN';

export type StructureEvidence = {
  macroRegime: Regime;
  htfStructure: StructureState;
  intermediateStructure: StructureState;
  executionStructure: StructureState;
  rangeState: 'EXPANSION'|'CONTRACTION'|'STABLE'|'INVALIDATED'|'UNDEFINED';
  rangePositionPercent: number|null;
  rangePosition: RangePosition;
  liquidityEvent: LiquidityState;
  structuralResponse: 'REJECTION'|'ACCEPTANCE'|'NONE'|'UNCONFIRMED';
  trendTransition: TrendTransition;
  volatilityState: 'EXPANDING'|'CONTRACTING'|'NORMAL'|'ABNORMAL'|'UNKNOWN';
  correctionProbability: number;
  stageProbability: number;
  structuralConfidence: number;
  structuralInvalidationPrice: number|null;
  invalidationStatus: 'VALID'|'WEAK'|'TOO_WIDE'|'TOO_CLOSE'|'UNCERTAIN';
  rangeRegimeProbability: number;
  trendProbability: number;
  compressionProbability: number;
  expansionProbability: number;
  dataQuality: 'HIGH'|'MEDIUM'|'LOW'|'INSUFFICIENT';
  contradiction: boolean;
};

const finite=(n:number)=>Number.isFinite(n);
const avg=(a:number[])=>a.length?a.reduce((s,n)=>s+n,0)/a.length:null;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const atr=(b:MarketBar[],p=14)=>{if(b.length<p+1)return null;const tr=b.slice(1).map((x,i)=>Math.max(x.h-x.l,Math.abs(x.h-b[i].c),Math.abs(x.l-b[i].c)));return avg(tr.slice(-p));};
const range=(b:MarketBar[])=>{if(!b.length)return null;const h=Math.max(...b.map(x=>x.h)),l=Math.min(...b.map(x=>x.l));return h>l?{high:h,low:l,width:h-l}:null;};
const structure=(b:MarketBar[]):StructureState=>{if(b.length<12)return 'INSUFFICIENT_DATA';const a=b.slice(-6),z=b.slice(-12,-6);const ah=Math.max(...a.map(x=>x.h)),al=Math.min(...a.map(x=>x.l)),zh=Math.max(...z.map(x=>x.h)),zl=Math.min(...z.map(x=>x.l));if(ah>zh&&al>zl)return 'BULLISH';if(ah<zh&&al<zl)return 'BEARISH';if(Math.abs(ah-zh)<Math.abs(ah)*0.0001&&Math.abs(al-zl)<Math.abs(al)*0.0001)return 'RANGE';return 'TRANSITION';};
const regime=(b:MarketBar[]):Regime=>{if(b.length<30)return 'INSUFFICIENT_DATA';const s=structure(b),a=atr(b),r=range(b.slice(-30));if(!a||!r)return 'UNCERTAIN';const recent=atr(b.slice(-15));if(recent&&recent>a*1.8)return 'HIGH_VOLATILITY';if(recent&&recent<a*.55)return 'LOW_VOLATILITY';if(s==='BULLISH')return 'BULLISH_TREND';if(s==='BEARISH')return 'BEARISH_TREND';if(s==='RANGE'){const p=(b.at(-1)!.c-r.low)/r.width;if(p<.25)return 'ACCUMULATION';if(p>.75)return 'DISTRIBUTION';return 'RANGE';}return 'TRANSITION';};
const transition=(b:MarketBar[]):TrendTransition=>{if(b.length<24)return 'UNCERTAIN';const recent=structure(b.slice(-12)),prior=structure(b.slice(-24,-12));if(recent===prior||recent==='RANGE')return 'NO_STRUCTURAL_CHANGE';if((prior==='BEARISH'&&recent==='BULLISH')||(prior==='BULLISH'&&recent==='BEARISH')){const last=b.at(-1)!,prev=b.slice(-13,-1);const broke=recent==='BULLISH'?last.c>Math.max(...prev.map(x=>x.h)):last.c<Math.min(...prev.map(x=>x.l));return broke?'CONFIRMED_TREND_FLIP':'POSSIBLE_TREND_FLIP';}return 'EARLY_TRANSITION';};
const liquidity=(b:MarketBar[]):{event:LiquidityState,response:StructureEvidence['structuralResponse']}=>{if(b.length<20)return{event:'UNCONFIRMED',response:'UNCONFIRMED'};const w=b.slice(-20,-2),hi=Math.max(...w.map(x=>x.h)),lo=Math.min(...w.map(x=>x.l)),last=b.at(-1)!;const prev=b.at(-2)!;if(last.h>hi&&last.c<hi)return{event:'PREVIOUS_HIGH_SWEEP',response:'REJECTION'};if(last.l<lo&&last.c>lo)return{event:'PREVIOUS_LOW_SWEEP',response:'REJECTION'};if(last.h>hi)return{event:'ACCEPTANCE',response:'ACCEPTANCE'};if(last.l<lo)return{event:'ACCEPTANCE',response:'ACCEPTANCE'};if(Math.abs(last.h-prev.h)<=Math.max(atr(b)??0,Math.abs(last.c)*.0002)&&last.c<prev.h)return{event:'EQUAL_HIGH_SWEEP',response:'REJECTION'};if(Math.abs(last.l-prev.l)<=Math.max(atr(b)??0,Math.abs(last.c)*.0002)&&last.c>prev.l)return{event:'EQUAL_LOW_SWEEP',response:'REJECTION'};return{event:'NONE',response:'NONE'};};
export function analyzeMarketStructure(input:{monthly?:MarketBar[];weekly?:MarketBar[];daily?:MarketBar[];h4?:MarketBar[];h1?:MarketBar[];execution?:MarketBar[];entry?:number;direction?:'BUY'|'SELL'}):StructureEvidence{
 const monthly=input.monthly??[],weekly=input.weekly??[],daily=input.daily??[],h4=input.h4??[],h1=input.h1??[],execution=input.execution??[];
 const source=daily.length?daily:h4.length?h4:h1;
 if(source.length<30)return {macroRegime:'INSUFFICIENT_DATA',htfStructure:'INSUFFICIENT_DATA',intermediateStructure:'INSUFFICIENT_DATA',executionStructure:'INSUFFICIENT_DATA',rangeState:'UNDEFINED',rangePositionPercent:null,rangePosition:'UNDEFINED',liquidityEvent:'UNCONFIRMED',structuralResponse:'UNCONFIRMED',trendTransition:'UNCERTAIN',volatilityState:'UNKNOWN',correctionProbability:0,stageProbability:0,structuralConfidence:0,structuralInvalidationPrice:null,invalidationStatus:'UNCERTAIN',rangeRegimeProbability:0,trendProbability:0,compressionProbability:0,expansionProbability:0,dataQuality:'INSUFFICIENT',contradiction:true};
 const r=range(source.slice(-30))!,pos=clamp((source.at(-1)!.c-r.low)/r.width),vol=atr(source),recentAtr=atr(source.slice(-15)),liq=liquidity(source),tr=transition(source);const sH=structure(h1.length?h1:source),sE=structure(execution.length?execution:h1.length?h1:source),sD=structure(daily.length?daily:source),sW=structure(weekly.length?weekly:source),sM=structure(monthly.length?monthly:source);const macro=sM==='BULLISH'||sW==='BULLISH'?'BULLISH_TREND':sM==='BEARISH'||sW==='BEARISH'?'BEARISH_TREND':regime(source);const rangeState=recentAtr&&vol?(recentAtr>vol*1.25?'EXPANSION':recentAtr<vol*.75?'CONTRACTION':'STABLE'):'UNDEFINED';const rangePosition:RangePosition=pos<=.1?'LOWER_EXTREME':pos<=.25?'LOWER_QUARTILE':pos<.75?'MID_RANGE':pos<.9?'UPPER_QUARTILE':'UPPER_EXTREME';const correctionProbability=clamp((macro==='CORRECTION'?0.7:0.15)+(tr==='POSSIBLE_TREND_FLIP'?0.2:0)+(rangeState==='CONTRACTION'?0.1:0));const trendProbability=clamp((sW==='BULLISH'||sW==='BEARISH'?0.35:0)+(sD==='BULLISH'||sD==='BEARISH'?0.3:0)+(sH==='BULLISH'||sH==='BEARISH'?0.2:0)+(tr==='CONFIRMED_TREND_FLIP'?0.15:0));const compressionProbability=rangeState==='CONTRACTION'?0.8:rangeState==='STABLE'?0.35:0.1;const expansionProbability=rangeState==='EXPANSION'?0.8:rangeState==='STABLE'?0.3:0.1;const invalidation=input.direction&&input.entry?input.direction==='BUY'?Math.min(...source.slice(-12).map(x=>x.l)):Math.max(...source.slice(-12).map(x=>x.h)):null;const distance=invalidation!==null&&input.entry?Math.abs(input.entry-invalidation):null;const invalidationStatus=distance===null||!vol?'UNCERTAIN':distance<vol*.35?'TOO_CLOSE':distance>vol*4?'TOO_WIDE':'VALID';const volatilityState=recentAtr&&vol?(recentAtr>vol*1.5?'ABNORMAL':recentAtr>vol*1.15?'EXPANDING':recentAtr<vol*.8?'CONTRACTING':'NORMAL'):'UNKNOWN';const aligned=input.direction==='BUY'?macro==='BULLISH_TREND'||sD==='BULLISH'||sH==='BULLISH':input.direction==='SELL'?macro==='BEARISH_TREND'||sD==='BEARISH'||sH==='BEARISH':true;const contradiction=!!input.direction&&((input.direction==='BUY'&&(sD==='BEARISH'&&sH==='BEARISH'))||(input.direction==='SELL'&&(sD==='BULLISH'&&sH==='BULLISH')));const confidence=clamp((dataQuality(source)=== 'HIGH'?0.35:0.2)+trendProbability*.35+(liq.response==='REJECTION'?0.15:0)+(aligned?0.15:0));return {macroRegime:macro,htfStructure:sW!=='INSUFFICIENT_DATA'?sW:sD,intermediateStructure:sD,executionStructure:sE,rangeState,rangePositionPercent:Math.round(pos*10000)/100,rangePosition,liquidityEvent:liq.event,structuralResponse:liq.response,trendTransition:tr,volatilityState,correctionProbability,stageProbability:clamp(correctionProbability*.8+(tr==='POSSIBLE_TREND_FLIP'?.2:0)),structuralConfidence:confidence,structuralInvalidationPrice:invalidation,invalidationStatus,rangeRegimeProbability:clamp(1-trendProbability),trendProbability,compressionProbability,expansionProbability,dataQuality:dataQuality(source),contradiction};
}
function dataQuality(b:MarketBar[]):'HIGH'|'MEDIUM'|'LOW'|'INSUFFICIENT'{if(b.length<30)return 'INSUFFICIENT';const recent=b.slice(-30);let bad=0;for(let i=0;i<recent.length;i++){const x=recent[i];if(!(finite(x.o)&&finite(x.h)&&finite(x.l)&&finite(x.c))||x.h<x.l||x.h<Math.max(x.o,x.c)||x.l>Math.min(x.o,x.c))bad++;if(i&&x.t<=recent[i-1].t)bad++;}if(bad>2)return 'LOW';if(bad)return 'MEDIUM';return 'HIGH';}
