import type { MarketBar } from './market-data';

export type StructuralRegime = 'BULLISH_TREND'|'BEARISH_TREND'|'RANGE'|'ACCUMULATION'|'DISTRIBUTION'|'CORRECTION'|'TRANSITION'|'HIGH_VOLATILITY'|'LOW_VOLATILITY'|'UNCERTAIN'|'INSUFFICIENT_DATA';
export type StructureState = 'BULLISH'|'BEARISH'|'RANGE'|'TRANSITION'|'UNCERTAIN'|'INSUFFICIENT_DATA';
export type RangeLocation = 'LOWER_EXTREME'|'LOWER_QUARTILE'|'MID_RANGE'|'UPPER_QUARTILE'|'UPPER_EXTREME'|'UNDEFINED';
export type LiquidityEvent = 'NONE'|'PREVIOUS_HIGH_SWEEP'|'PREVIOUS_LOW_SWEEP'|'PREVIOUS_WEEK_HIGH_SWEEP'|'PREVIOUS_WEEK_LOW_SWEEP'|'PREVIOUS_MONTH_HIGH_SWEEP'|'PREVIOUS_MONTH_LOW_SWEEP'|'EQUAL_HIGH_SWEEP'|'EQUAL_LOW_SWEEP'|'ACCEPTANCE'|'REJECTION'|'FAILED_SWEEP'|'UNCONFIRMED';
export type LiquidityResponse = 'NONE'|'REJECTION'|'ACCEPTANCE'|'FAILED_SWEEP'|'CONFIRMED_STRUCTURAL_REVERSAL'|'UNCONFIRMED';
export type TrendTransition = 'EARLY_TRANSITION'|'POSSIBLE_TREND_FLIP'|'CONFIRMED_TREND_FLIP'|'FAILED_TREND_FLIP'|'NO_STRUCTURAL_CHANGE'|'UNCERTAIN';
export type CorrectionStage = 'NONE'|'EARLY_CORRECTION'|'SHOCK_IMPULSE'|'RELIEF_MOVE'|'DEEPER_CORRECTION'|'CAPITULATION'|'LATE_CORRECTION'|'POST_CORRECTION_TRANSITION';
export type InvalidationStatus = 'VALID'|'WEAK'|'TOO_WIDE'|'TOO_CLOSE'|'UNCERTAIN';

export type StructuralEvidence = {
  macroRegime: StructuralRegime;
  htfStructure: StructureState;
  intermediateStructure: StructureState;
  executionStructure: StructureState;
  rangeState: 'EXPANSION'|'CONTRACTION'|'STABLE'|'INVALIDATED'|'UNDEFINED';
  rangeHigh: number|null;
  rangeLow: number|null;
  rangeMidpoint: number|null;
  rangePositionPercent: number|null;
  rangeLocation: RangeLocation;
  liquidityEvent: LiquidityEvent;
  liquidityResponse: LiquidityResponse;
  periodicLevels: {
    previousDayHigh:number|null; previousDayLow:number|null;
    previousWeekHigh:number|null; previousWeekLow:number|null;
    previousMonthHigh:number|null; previousMonthLow:number|null;
  };
  trendTransition: TrendTransition;
  correctionProbability: number;
  stageProbability: number;
  possibleCorrectionStage: CorrectionStage;
  volatilityState: 'EXPANDING'|'CONTRACTING'|'NORMAL'|'ABNORMAL'|'UNKNOWN';
  atr: number|null;
  structuralInvalidationPrice: number|null;
  invalidationStatus: InvalidationStatus;
  rangeRegimeProbability: number;
  trendProbability: number;
  compressionProbability: number;
  expansionProbability: number;
  supportingBias: 'BUY'|'SELL'|'NEUTRAL'|'UNCONFIRMED';
  supportingConfidence: number;
  dataQuality: 'HIGH'|'MEDIUM'|'LOW'|'INSUFFICIENT';
  contradiction: boolean;
  requiresConfirmation: boolean;
};

export type SupportingMechanismInput = {
  monthly?: MarketBar[];
  weekly?: MarketBar[];
  daily?: MarketBar[];
  h4?: MarketBar[];
  h1?: MarketBar[];
  execution?: MarketBar[];
  direction?: 'BUY'|'SELL';
  entry?: number;
  now?: Date;
};

const clamp = (n:number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const mean = (a:number[]) => a.length ? a.reduce((s,n) => s+n, 0) / a.length : null;
const sort = (b:MarketBar[]) => [...b].sort((a,c) => Date.parse(a.timestamp) - Date.parse(c.timestamp));

function atr(b:MarketBar[], period=14):number|null {
  if (b.length < period + 1) return null;
  const values = b.slice(1).map((x,i) => Math.max(x.high-x.low, Math.abs(x.high-b[i].close), Math.abs(x.low-b[i].close))).slice(-period);
  return mean(values);
}

function structure(b:MarketBar[]):StructureState {
  if (b.length < 12) return 'INSUFFICIENT_DATA';
  const recent=b.slice(-6), prior=b.slice(-12,-6);
  const recentHigh=Math.max(...recent.map(x=>x.high)), recentLow=Math.min(...recent.map(x=>x.low));
  const priorHigh=Math.max(...prior.map(x=>x.high)), priorLow=Math.min(...prior.map(x=>x.low));
  const tolerance=Math.max(Math.abs(priorHigh)*0.0001,1e-12);
  if (recentHigh>priorHigh+tolerance && recentLow>priorLow+tolerance) return 'BULLISH';
  if (recentHigh<priorHigh-tolerance && recentLow<priorLow-tolerance) return 'BEARISH';
  if (Math.abs(recentHigh-priorHigh)<=tolerance && Math.abs(recentLow-priorLow)<=tolerance) return 'RANGE';
  return 'TRANSITION';
}

function period(b:MarketBar[]) {
  if (!b.length) return {high:null as number|null,low:null as number|null};
  return {high:Math.max(...b.map(x=>x.high)),low:Math.min(...b.map(x=>x.low))};
}

function previous(b:MarketBar[], milliseconds:number) {
  if (b.length < 2) return period([]);
  const s=sort(b), bucket=Math.floor(Date.parse(s[s.length-1].timestamp)/milliseconds);
  return period(s.filter(x=>Math.floor(Date.parse(x.timestamp)/milliseconds)===bucket-1));
}

function range(b:MarketBar[]) {
  if (!b.length) return null;
  const high=Math.max(...b.map(x=>x.high)), low=Math.min(...b.map(x=>x.low));
  if (!(high>low)) return null;
  const pos=clamp((b[b.length-1].close-low)/(high-low));
  return {high,low,midpoint:(high+low)/2,pos};
}

function location(p:number|null):RangeLocation {
  if (p===null) return 'UNDEFINED';
  if (p<=0.1) return 'LOWER_EXTREME';
  if (p<=0.25) return 'LOWER_QUARTILE';
  if (p<0.75) return 'MID_RANGE';
  if (p<0.9) return 'UPPER_QUARTILE';
  return 'UPPER_EXTREME';
}

function transition(b:MarketBar[]):TrendTransition {
  if (b.length<24) return 'UNCERTAIN';
  const recent=structure(b.slice(-12)), prior=structure(b.slice(-24,-12));
  if (recent===prior || recent==='RANGE') return 'NO_STRUCTURAL_CHANGE';
  if ((prior==='BEARISH'&&recent==='BULLISH')||(prior==='BULLISH'&&recent==='BEARISH')) {
    const last=b[b.length-1], ref=b.slice(-13,-1);
    const confirmed=recent==='BULLISH'
      ? last.close>Math.max(...ref.map(x=>x.high))
      : last.close<Math.min(...ref.map(x=>x.low));
    return confirmed?'CONFIRMED_TREND_FLIP':'POSSIBLE_TREND_FLIP';
  }
  return 'EARLY_TRANSITION';
}

function liquidity(b:MarketBar[],levels:StructuralEvidence['periodicLevels']):{event:LiquidityEvent;response:LiquidityResponse} {
  if (b.length<20) return {event:'UNCONFIRMED',response:'UNCONFIRMED'};
  const last=b[b.length-1], local=b.slice(-21,-1);
  const localHigh=Math.max(...local.map(x=>x.high)), localLow=Math.min(...local.map(x=>x.low));
  const checks:Array<[number|null,number|null,LiquidityEvent,LiquidityEvent]>=[
    [levels.previousMonthHigh,levels.previousMonthLow,'PREVIOUS_MONTH_HIGH_SWEEP','PREVIOUS_MONTH_LOW_SWEEP'],
    [levels.previousWeekHigh,levels.previousWeekLow,'PREVIOUS_WEEK_HIGH_SWEEP','PREVIOUS_WEEK_LOW_SWEEP'],
    [levels.previousDayHigh,levels.previousDayLow,'PREVIOUS_HIGH_SWEEP','PREVIOUS_LOW_SWEEP'],
    [localHigh,localLow,'PREVIOUS_HIGH_SWEEP','PREVIOUS_LOW_SWEEP'],
  ];
  for (const [high,low,highEvent,lowEvent] of checks) {
    if (high!==null && last.high>high && last.close<high) return {event:highEvent,response:'REJECTION'};
    if (low!==null && last.low<low && last.close>low) return {event:lowEvent,response:'REJECTION'};
  }
  if (last.high>localHigh || last.low<localLow) return {event:'ACCEPTANCE',response:'ACCEPTANCE'};
  return {event:'NONE',response:'NONE'};
}

function quality(b:MarketBar[],now:Date):StructuralEvidence['dataQuality'] {
  if (b.length<30) return 'INSUFFICIENT';
  let bad=0; const s=sort(b).slice(-30);
  for (let i=0;i<s.length;i+=1) {
    const x=s[i], t=Date.parse(x.timestamp);
    if (!Number.isFinite(t)||t>now.getTime()+300000) bad+=1;
    if (![x.open,x.high,x.low,x.close].every(Number.isFinite)||x.high<Math.max(x.open,x.close)||x.low>Math.min(x.open,x.close)||x.high<x.low) bad+=1;
    if (i && t<=Date.parse(s[i-1].timestamp)) bad+=1;
  }
  return bad>2?'LOW':bad?'MEDIUM':'HIGH';
}

function correction(b:MarketBar[],regime:StructuralRegime,tr:TrendTransition,volatility:StructuralEvidence['volatilityState']) {
  if (b.length<30) return {probability:0,stageProbability:0,stage:'NONE' as CorrectionStage};
  const averageRange=atr(b), recent=b.slice(-8), prior=b.slice(-24,-8);
  const impulse=prior.length?Math.abs(prior[prior.length-1].close-prior[0].close):0;
  const recentMove=recent.length?Math.abs(recent[recent.length-1].close-recent[0].close):0;
  const ratio=impulse>0?recentMove/impulse:0;
  const probability=clamp((regime==='CORRECTION'?0.55:0.12)+(tr==='POSSIBLE_TREND_FLIP'?0.18:0)+(volatility==='CONTRACTING'?0.1:0));
  let stage:CorrectionStage='NONE';
  if (probability>=0.55) {
    if (averageRange && recentMove>averageRange*3) stage='SHOCK_IMPULSE';
    else if (ratio>0.7) stage='DEEPER_CORRECTION';
    else if (ratio<0.25) stage='RELIEF_MOVE';
    else stage='LATE_CORRECTION';
  }
  const stageProbability=clamp(probability*(ratio>0 ? 0.7+Math.min(ratio,1)*0.3 : 0.5));
  return {probability,stageProbability,stage};
}

export function analyzeSupportingMechanism(input:SupportingMechanismInput):StructuralEvidence {
  const now=input.now??new Date();
  const monthly=sort(input.monthly??[]), weekly=sort(input.weekly??[]), daily=sort(input.daily??[]), h4=sort(input.h4??[]), h1=sort(input.h1??[]), execution=sort(input.execution??[]);
  const source=daily.length?daily:h4.length?h4:h1.length?h1:execution;
  const empty:StructuralEvidence={
    macroRegime:'INSUFFICIENT_DATA',htfStructure:'INSUFFICIENT_DATA',intermediateStructure:'INSUFFICIENT_DATA',executionStructure:'INSUFFICIENT_DATA',
    rangeState:'UNDEFINED',rangeHigh:null,rangeLow:null,rangeMidpoint:null,rangePositionPercent:null,rangeLocation:'UNDEFINED',
    liquidityEvent:'UNCONFIRMED',liquidityResponse:'UNCONFIRMED',periodicLevels:{previousDayHigh:null,previousDayLow:null,previousWeekHigh:null,previousWeekLow:null,previousMonthHigh:null,previousMonthLow:null},
    trendTransition:'UNCERTAIN',correctionProbability:0,stageProbability:0,possibleCorrectionStage:'NONE',volatilityState:'UNKNOWN',atr:null,
    structuralInvalidationPrice:null,invalidationStatus:'UNCERTAIN',rangeRegimeProbability:0,trendProbability:0,compressionProbability:0,expansionProbability:0,
    supportingBias:'UNCONFIRMED',supportingConfidence:0,dataQuality:'INSUFFICIENT',contradiction:true,requiresConfirmation:true,
  };
  if (source.length<30) return empty;
  const r=range(source.slice(-30)); if (!r) return empty;
  const htf=structure(weekly.length?weekly:daily), intermediate=structure(daily.length?daily:h4), executionState=structure(execution.length?execution:h1.length?h1:source);
  const averageRange=atr(source), recentAtr=atr(source.slice(-15));
  const volatilityState:StructuralEvidence['volatilityState']=averageRange&&recentAtr
    ? recentAtr>averageRange*1.5?'ABNORMAL'
      : recentAtr>averageRange*1.15?'EXPANDING'
      : recentAtr<averageRange*0.8?'CONTRACTING'
      : 'NORMAL'
    : 'UNKNOWN';
  const rangeState:StructuralEvidence['rangeState']=averageRange&&recentAtr
    ? recentAtr>averageRange*1.25?'EXPANSION'
      : recentAtr<averageRange*0.75?'CONTRACTION'
      : 'STABLE'
    : 'UNDEFINED';
  const periodicLevels={
    previousDayHigh:previous(daily,86400000).high,previousDayLow:previous(daily,86400000).low,
    previousWeekHigh:previous(weekly,604800000).high,previousWeekLow:previous(weekly,604800000).low,
    previousMonthHigh:previous(monthly,2592000000).high,previousMonthLow:previous(monthly,2592000000).low,
  };
  const liq=liquidity(source,periodicLevels), trendTransition=transition(daily.length?daily:source);
  const trendProbability=clamp(
    (htf==='BULLISH'||htf==='BEARISH'?0.35:0)+
    (intermediate==='BULLISH'||intermediate==='BEARISH'?0.3:0)+
    (executionState==='BULLISH'||executionState==='BEARISH'?0.2:0)+
    (trendTransition==='CONFIRMED_TREND_FLIP'?0.15:0),
  );
  const macroRegime:StructuralRegime=htf==='BULLISH'?'BULLISH_TREND':htf==='BEARISH'?'BEARISH_TREND':intermediate==='BULLISH'?'BULLISH_TREND':intermediate==='BEARISH'?'BEARISH_TREND':rangeState==='CONTRACTION'?'CORRECTION':'RANGE';
  const correctionResult=correction(source,macroRegime,trendTransition,volatilityState);
  const invalidation=input.direction&&input.entry
    ? input.direction==='BUY'?Math.min(...source.slice(-12).map(x=>x.low)):Math.max(...source.slice(-12).map(x=>x.high))
    : null;
  const distance=invalidation!==null&&input.entry?Math.abs(input.entry-invalidation):null;
  const invalidationStatus:InvalidationStatus=distance===null||!averageRange?'UNCERTAIN':distance<averageRange*0.35?'TOO_CLOSE':distance>averageRange*4?'TOO_WIDE':'VALID';
  const contradiction=input.direction==='BUY'
    ? htf==='BEARISH'&&intermediate==='BEARISH'
    : input.direction==='SELL'
      ? htf==='BULLISH'&&intermediate==='BULLISH'
      : false;
  const aligned=input.direction==='BUY'
    ? macroRegime==='BULLISH_TREND'||intermediate==='BULLISH'||htf==='BULLISH'
    : input.direction==='SELL'
      ? macroRegime==='BEARISH_TREND'||intermediate==='BEARISH'||htf==='BEARISH'
      : false;
  const dataQuality=quality(source,now);
  const supportingConfidence=clamp((dataQuality==='HIGH'?0.35:dataQuality==='MEDIUM'?0.2:0)+trendProbability*0.35+(liq.response==='REJECTION'?0.15:0)+(aligned?0.15:0));
  return {
    macroRegime,htfStructure:htf,intermediateStructure:intermediate,executionStructure:executionState,rangeState,
    rangeHigh:r.high,rangeLow:r.low,rangeMidpoint:r.midpoint,rangePositionPercent:Math.round(r.pos*10000)/100,rangeLocation:location(r.pos),
    liquidityEvent:liq.event,liquidityResponse:liq.response,periodicLevels,trendTransition,
    correctionProbability:correctionResult.probability,stageProbability:correctionResult.stageProbability,possibleCorrectionStage:correctionResult.stage,
    volatilityState,atr:averageRange,structuralInvalidationPrice:invalidation,invalidationStatus,
    rangeRegimeProbability:clamp(1-trendProbability),trendProbability,compressionProbability:rangeState==='CONTRACTION'?0.8:rangeState==='STABLE'?0.35:0.1,expansionProbability:rangeState==='EXPANSION'?0.8:rangeState==='STABLE'?0.3:0.1,
    supportingBias:contradiction?'UNCONFIRMED':aligned?(input.direction??'NEUTRAL'):'NEUTRAL',supportingConfidence,dataQuality,contradiction,
    requiresConfirmation:dataQuality!=='HIGH'||contradiction||liq.response==='UNCONFIRMED'||invalidationStatus!=='VALID',
  };
}
