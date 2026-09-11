/** Deterministic performance analytics for completed SmartVibe trade records. */
export type CompletedTrade = {
  instrument:string;
  direction:'BUY'|'SELL';
  timeframe:string;
  marketRegime:string;
  session:string;
  setup:string;
  methodologyVersion:string;
  supportingEvidenceKey?:string;
  pnl:number;
  closedAt:string|number;
};

export type PerformanceMetrics = {
  totalTrades:number;
  winningTrades:number;
  losingTrades:number;
  winRate:number;
  profitFactor:number|null;
  grossProfit:number;
  grossLoss:number;
  averageWin:number;
  averageLoss:number;
  expectancy:number;
  maximumDrawdown:number;
  periods:Record<string,number>;
  byInstrument:Record<string,number>;
  byTimeframe:Record<string,number>;
  byMarketRegime:Record<string,number>;
  bySession:Record<string,number>;
  bySetup:Record<string,number>;
  byDirection:Record<string,number>;
  bySupportingEvidence:Record<string,number>;
  byMethodologyVersion:Record<string,number>;
};

const sum=(xs:number[])=>xs.reduce((a,b)=>a+b,0);
const bucket=(out:Record<string,number>,key:string,pnl:number)=>{out[key]=(out[key]??0)+pnl;};
function periodKey(value:string|number):string {
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return 'UNKNOWN';
  const y=d.getUTCFullYear(),m=String(d.getUTCMonth()+1).padStart(2,'0'),day=String(d.getUTCDate()).padStart(2,'0');
  const week=Math.ceil((d.getUTCDate()+new Date(Date.UTC(y,d.getUTCMonth(),1)).getUTCDay())/7);
  return `${y}-${m}-${day}|week-${week}|month-${y}-${m}|year-${y}`;
}

export function calculatePerformance(trades:CompletedTrade[]):PerformanceMetrics {
  const wins=trades.filter(t=>t.pnl>0).map(t=>t.pnl), losses=trades.filter(t=>t.pnl<0).map(t=>t.pnl);
  let equity=0,peak=0,maxDrawdown=0;
  for(const t of [...trades].sort((a,b)=>new Date(a.closedAt).getTime()-new Date(b.closedAt).getTime())){equity+=t.pnl;peak=Math.max(peak,equity);maxDrawdown=Math.max(maxDrawdown,peak-equity);}
  const byInstrument:Record<string,number>={},byTimeframe:Record<string,number>={},byMarketRegime:Record<string,number>={},bySession:Record<string,number>={},bySetup:Record<string,number>={},byDirection:Record<string,number>={},bySupportingEvidence:Record<string,number>={},byMethodologyVersion:Record<string,number>={};
  const periods:Record<string,number>={daily:0,weekly:0,monthly:0,yearly:0,total:sum(trades.map(t=>t.pnl))};
  for(const t of trades){bucket(byInstrument,t.instrument,t.pnl);bucket(byTimeframe,t.timeframe,t.pnl);bucket(byMarketRegime,t.marketRegime,t.pnl);bucket(bySession,t.session,t.pnl);bucket(bySetup,t.setup,t.pnl);bucket(byDirection,t.direction,t.pnl);bucket(bySupportingEvidence,t.supportingEvidenceKey??'UNSPECIFIED',t.pnl);bucket(byMethodologyVersion,t.methodologyVersion,t.pnl);}
  const grossProfit=sum(wins),grossLoss=sum(losses.map(Math.abs));
  const daily=new Set<string>(),weekly=new Set<string>(),monthly=new Set<string>(),yearly=new Set<string>();
  for(const t of trades){const p=periodKey(t.closedAt).split('|');daily.add(p[0]);weekly.add(p[1]);monthly.add(p[2]);yearly.add(p[3]);}
  periods.daily=daily.size;periods.weekly=weekly.size;periods.monthly=monthly.size;periods.yearly=yearly.size;
  return {totalTrades:trades.length,winningTrades:wins.length,losingTrades:losses.length,winRate:trades.length?wins.length/trades.length:0,profitFactor:grossLoss?grossProfit/grossLoss:null,grossProfit,grossLoss,averageWin:wins.length?grossProfit/wins.length:0,averageLoss:losses.length?grossLoss/losses.length:0,expectancy:trades.length?sum(trades.map(t=>t.pnl))/trades.length:0,maximumDrawdown:maxDrawdown,periods,byInstrument,byTimeframe,byMarketRegime,bySession,bySetup,byDirection,bySupportingEvidence,byMethodologyVersion};
}
