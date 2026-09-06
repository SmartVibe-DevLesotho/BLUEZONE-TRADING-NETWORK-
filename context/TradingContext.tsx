import React, { createContext, useContext, useState } from 'react';
import { Instrument, instruments } from '@/instruments';

export type PaperPosition = { id:string; symbol:string; side:'BUY'|'SELL'; size:number; entry:number; sl:number; tp:number; openedAt:string };
export type TradingEvent = { id:string; title:string; detail:string; amount?:number; createdAt:string };
type TradingContextValue = { selectedInstrument:Instrument; setSelectedInstrument:(i:Instrument)=>void; selectedStrategy:string; setSelectedStrategy:(v:string)=>void; selectedSession:string; setSelectedSession:(v:string)=>void; selectedStyle:string; setSelectedStyle:(v:string)=>void; consensusThreshold:number; setConsensusThreshold:(v:number)=>void; positions:PaperPosition[]; events:TradingEvent[]; placePaperTrade:(p:Omit<PaperPosition,'id'|'openedAt'>)=>void; closePosition:(id:string)=>void };
const fallback = instruments.find(i=>i.symbol==='XAUUSD') ?? instruments[0];
const TradingContext = createContext<TradingContextValue | null>(null);
export function TradingProvider({children}:{children:React.ReactNode}){
 const [selectedInstrument,setSelectedInstrument]=useState(fallback);
 const [selectedStrategy,setSelectedStrategy]=useState('CRT Range Reversal');
 const [selectedSession,setSelectedSession]=useState('London');
 const [selectedStyle,setSelectedStyle]=useState('Day Trading');
 const [consensusThreshold,setConsensusThreshold]=useState(6);
 const [positions,setPositions]=useState<PaperPosition[]>([]);
 const [events,setEvents]=useState<TradingEvent[]>([]);
 function placePaperTrade(p:Omit<PaperPosition,'id'|'openedAt'>){ if(!Number.isFinite(p.size)||p.size<=0||![p.entry,p.sl,p.tp].every(Number.isFinite)) throw new Error('Invalid paper trade parameters.'); const id=`paper-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; const openedAt=new Date().toISOString(); setPositions(v=>[...v,{...p,id,openedAt}]); setEvents(v=>[{id:`event-${Date.now()}`,title:'Position opened',detail:`${p.side} ${p.symbol}`,createdAt:openedAt},...v]); }
 function closePosition(id:string){ const position=positions.find(p=>p.id===id); if(!position)return; setPositions(v=>v.filter(p=>p.id!==id)); setEvents(v=>[{id:`event-${Date.now()}`,title:'Position closed',detail:`${position.side} ${position.symbol}`,amount:0,createdAt:new Date().toISOString()},...v]); }
 return <TradingContext.Provider value={{selectedInstrument,setSelectedInstrument,selectedStrategy,setSelectedStrategy,selectedSession,setSelectedSession,selectedStyle,setSelectedStyle,consensusThreshold,setConsensusThreshold,positions,events,placePaperTrade,closePosition}}>{children}</TradingContext.Provider>;
}
export function useTrading(){ const value=useContext(TradingContext); if(!value)throw new Error('useTrading must be used inside TradingProvider'); return value; }
