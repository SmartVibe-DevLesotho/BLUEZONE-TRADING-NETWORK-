import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { G, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { Screen, Card, C, Badge } from '@/components/ui';
import { getMt5MarketBars, type MarketQuote } from '@/lib/backend';
import { instruments } from '@/instruments';
import { useTrading } from '@/context/TradingContext';
import { calculateSmartVibeIndicators, toneColor, type IndicatorSnapshot } from '@/lib/engine/smartvibe-chart-indicators';

const classes = ['Forex','Metals','Crypto','Indices','Deriv'] as const;

function TradingViewStyleChart({ quote, indicators }: { quote: MarketQuote; indicators: IndicatorSnapshot }) {
  const candles=(quote.candles??[]).slice(-160);
  if(candles.length<2) return <Text style={{color:C.muted,marginTop:12}}>Live OHLC history is not available yet.</Text>;
  const width=1100,height=520,padX=18,padY=24;
  const highs=candles.map(c=>c.high), lows=candles.map(c=>c.low);
  const allValues=[...highs,...lows,...indicators.levels.map(x=>x.value),...indicators.zones.flatMap(z=>[z.top,z.bottom]),...indicators.htfCandles.flatMap(c=>[c.high,c.low])].filter(v=>Number.isFinite(v)) as number[];
  const min=Math.min(...allValues),max=Math.max(...allValues),span=max-min||1;
  const bodyWidth=Math.max(3,Math.min(8,(width-padX*2)/candles.length*.68));
  const xStep=(width-padX*2)/(candles.length-1);
  const x=(i:number)=>padX+i*xStep;
  const y=(v:number)=>height-padY-((v-min)/span)*(height-padY*2);
  const linePoints=(values:(number|null)[])=>values.slice(-candles.length).map((v,i)=>v===null?null:`${x(i)},${y(v)}`).filter(Boolean).join(' ');
  const visibleIndexOffset=Math.max(0,(quote.candles??[]).length-candles.length);
  return <View style={{marginTop:14,borderRadius:14,overflow:'hidden',backgroundColor:'#07101d',borderWidth:1,borderColor:C.border}}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={width} height={height}>
        <Rect x="0" y="0" width={width} height={height} fill="#07101d"/>
        {[0.2,0.4,0.6,0.8].map(p=><Line key={p} x1={padX} y1={height*p} x2={width-padX} y2={height*p} stroke="#162235" strokeWidth="1"/>)}
        {indicators.sessionLines.map((s,i)=><Rect key={`sess-${i}`} x={x(Math.max(0,s.start-visibleIndexOffset))} y={padY} width={Math.max(1,x(Math.min(candles.length-1,s.end-visibleIndexOffset))-x(Math.max(0,s.start-visibleIndexOffset)))} height={height-padY*2} fill={toneColor(s.tone??'blue')} opacity={0.045}/>)}
        {indicators.zones.map((z,i)=>{const l=Math.max(0,z.left-visibleIndexOffset),r=Math.min(candles.length-1,z.right-visibleIndexOffset);if(r<0||l>=candles.length)return null;return <Rect key={`z-${i}`} x={x(l)} y={y(z.top)} width={Math.max(2,x(r)-x(l))} height={Math.max(2,y(z.bottom)-y(z.top))} fill={z.dir==='bull'?'#22c55e':'#ef4444'} opacity={z.label==='FVG'?0.10:0.13} stroke={z.dir==='bull'?'#22c55e':'#ef4444'} strokeOpacity={0.4}/>})}
        {indicators.htfCandles.map((c,i)=>{const l=Math.max(0,c.left-visibleIndexOffset),r=Math.min(candles.length-1,c.right-visibleIndexOffset);if(r<0||l>=candles.length)return null;const cx=x((l+r)/2),up=c.close>=c.open;return <G key={`htf-${i}`}>{/* placeholder node intentionally avoided */}<Line x1={cx} y1={y(c.high)} x2={cx} y2={y(c.low)} stroke={up?'#38bdf8':'#fb7185'} strokeWidth="1"/><Rect x={cx-bodyWidth/2} y={Math.min(y(c.open),y(c.close))} width={bodyWidth} height={Math.max(2,Math.abs(y(c.close)-y(c.open)))} fill="none" stroke={up?'#38bdf8':'#fb7185'} strokeWidth="1.2"/></G>})}
        {indicators.levels.map((l,i)=><Line key={`lvl-${i}`} x1={padX} y1={y(l.value)} x2={width-padX} y2={y(l.value)} stroke={toneColor(l.tone??'white')} strokeWidth={l.name.startsWith('TP')||l.name==='ENTRY'||l.name==='SL'?1.6:1} strokeDasharray={l.kind==='dotted'?'2,5':l.kind==='dashed'?'6,5':undefined} opacity={0.85}/>)}
        {indicators.emaLines.map((e,idx)=><Polyline key={`ema-${idx}`} points={linePoints(e.values)} fill="none" stroke={idx===8?'#a855f7':idx<2?'#22d3ee':'#60a5fa'} strokeWidth={idx===8?2:1} opacity={idx===8?0.9:0.6}/>)}
        {indicators.smaLines.map((e,idx)=><Polyline key={`sma-${idx}`} points={linePoints(e.values)} fill="none" stroke={idx===0?'#f8fafc':'#facc15'} strokeWidth="1.2" opacity="0.75"/>)}
        {candles.map((c,i)=>{const up=c.close>=c.open,cx=x(i),top=y(Math.max(c.open,c.close)),bottom=y(Math.min(c.open,c.close));return <G key={`c-${i}`}><Line x1={cx} y1={y(c.high)} x2={cx} y2={y(c.low)} stroke={up?'#22c55e':'#ef4444'} strokeWidth="1.5"/><Rect x={cx-bodyWidth/2} y={Math.min(top,bottom)} width={bodyWidth} height={Math.max(2,Math.abs(bottom-top))} fill={up?'#22c55e':'#ef4444'}/></G>})}
        {indicators.markers.map((m,i)=>{const ix=m.index-visibleIndexOffset;if(ix<0||ix>=candles.length)return null;const cx=x(ix),cy=y(m.price);const buy=m.dir==='buy';return <G key={`m-${i}`}><Polygon points={buy?`${cx},${cy+16} ${cx-7},${cy+4} ${cx+7},${cy+4}`:`${cx},${cy-16} ${cx-7},${cy-4} ${cx+7},${cy-4}`} fill={buy?'#22c55e':'#ef4444'}/><SvgText x={cx+9} y={cy+(buy?20:-10)} fill={buy?'#86efac':'#fca5a5'} fontSize="10">{m.label}</SvgText></G>})}
        {indicators.levels.filter(l=>['ENTRY','SL','TP1','TP2','TP3','TP4','PDH','PDL','IBH','IBL'].includes(l.name)).map((l,i)=><SvgText key={`tag-${i}`} x={width-padX-3} y={y(l.value)-3} textAnchor="end" fill={toneColor(l.tone??'white')} fontSize="10" fontWeight="700">{l.name} {l.value.toFixed(quote.symbol.includes('JPY')?3:5)}</SvgText>)}
        <SvgText x={padX} y={18} fill="#e5e7eb" fontSize="12" fontWeight="700">SMARTVIBE TRADING NETWORK • LIVE INDICATOR ENGINE</SvgText>
      </Svg>
    </ScrollView>
  </View>;
}

// react-native-svg Polyline is imported lazily through the namespace below to keep the chart component compact.


function SignalRail({ quote, indicators }: { quote: MarketQuote; indicators: IndicatorSnapshot }) {
  const last=(quote.candles??[]).at(-1); if(!last)return null;
  return <Card>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
      <Text style={{fontWeight:'900',fontSize:18,color:C.ink}}>LIVE SMARTVIBE ENGINE</Text><Badge label="LIVE OHLC" tone="positive"/>
    </View>
    <Text style={{color:C.muted,marginTop:6,lineHeight:20}}>Live MT5 candles are rendered directly. Indicator calculations run on those candles; no screenshot interpretation and no synthetic blue-line chart.</Text>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:12}}>
      <Text style={{color:C.slate}}>O <Text style={{fontWeight:'900',color:C.ink}}>{last.open}</Text></Text>
      <Text style={{color:C.slate}}>H <Text style={{fontWeight:'900',color:C.ink}}>{last.high}</Text></Text>
      <Text style={{color:C.slate}}>L <Text style={{fontWeight:'900',color:C.ink}}>{last.low}</Text></Text>
      <Text style={{color:C.slate}}>C <Text style={{fontWeight:'900',color:C.ink}}>{last.close}</Text></Text>
    </View>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12}}>
      {indicators.dashboards.map((d,i)=><View key={i} style={{backgroundColor:'#07101d',borderRadius:10,padding:10,minWidth:220}}>
        <Text style={{color:'#67e8f9',fontWeight:'900'}}>{d.title}</Text>
        {d.rows.map(([k,v])=><Text key={k} style={{color:'#e5e7eb',fontSize:12,marginTop:4}}>{k}: <Text style={{fontWeight:'800'}}>{v}</Text></Text>)}
      </View>)}
    </View>
    {indicators.tradePlan?<Text style={{color:indicators.tradePlan.direction==='BUY'?C.green:C.red,fontWeight:'900',marginTop:10}}>ACTIVE PLAN: {indicators.tradePlan.direction} • ENTRY {indicators.tradePlan.entry} • SL {indicators.tradePlan.sl}</Text>:<Text style={{color:C.muted,marginTop:10}}>ACTIVE PLAN: WAIT — no confirmed SmartVibe crossover in the loaded live history.</Text>}
  </Card>;
}

export default function Chart(){
  const{selectedInstrument,setSelectedInstrument}=useTrading();
  const[assetClass,setAssetClass]=useState<(typeof classes)[number]>(selectedInstrument.class);
  const[quote,setQuote]=useState<MarketQuote|null>(null); const[loading,setLoading]=useState(true); const[error,setError]=useState('');
  const visible=useMemo(()=>instruments.filter(i=>i.class===assetClass).slice(0,30),[assetClass]);
  const indicators=useMemo(()=>quote?.candles?calculateSmartVibeIndicators(quote.candles):null,[quote?.candles]);
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{const result=await getMt5MarketBars(selectedInstrument.symbol);const candles=result.candles??[];const last=candles.at(-1);if(!last){setQuote(null);setError('MT5 live OHLC feed has not supplied candles yet.');return;}setQuote({symbol:selectedInstrument.symbol,price:last.close,change:last.open?((last.close-last.open)/last.open)*100:null,source:result.source,stale:false,asOf:result.asOf??undefined,candles});}
    catch(e:any){setQuote(null);setError(e?.message??'Unable to load live market data.');} finally{setLoading(false);}
  },[selectedInstrument.symbol]);
  useEffect(()=>{load();const timer=setInterval(load,15000);return()=>clearInterval(timer);},[load]);

  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <Text style={{fontSize:30,fontWeight:'900',color:C.ink}}>SMARTVIBE TRADING NETWORK</Text>
    <Text style={{color:C.muted,marginTop:4}}>TradingView-style live chart • SmartVibe indicator engine • MT5 OHLC • 15-second refresh.</Text>
    <Card elevated>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <View><Text style={{fontWeight:'900',color:C.ink}}>Instrument</Text><Text style={{fontSize:24,fontWeight:'900',marginTop:6,color:C.ink}}>{selectedInstrument.symbol}</Text></View>
        {quote?<Badge label="LIVE" tone="positive"/>:<Badge label="OFFLINE" tone="neutral"/>}
      </View>
      {loading?<ActivityIndicator style={{marginTop:18}} color={C.cyan}/>:quote&&indicators?<><Text style={{fontSize:28,fontWeight:'900',marginTop:12,color:C.ink}}>{Number.isFinite(quote.price)?quote.price.toLocaleString():'—'}</Text><Text style={{color:(quote.change??0)>=0?C.green:C.red,marginTop:5}}>{quote.change===null?'':`${quote.change>=0?'+':''}${quote.change}%`}</Text><TradingViewStyleChart quote={quote} indicators={indicators}/><Text style={{color:C.muted,fontSize:12,marginTop:8}}>Source: {quote.source} • as of {quote.asOf?new Date(quote.asOf).toLocaleTimeString(): '—'} • live candles only</Text></>:null}
      {error?<Text style={{color:C.red,marginTop:10,lineHeight:20}}>{error}</Text>:null}
    </Card>
    {quote&&indicators?<SignalRail quote={quote} indicators={indicators}/>:null}
    <Text style={{fontWeight:'900',fontSize:18,marginBottom:8,color:C.ink}}>Asset class</Text>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12}}>{classes.map(item=><Pressable key={item} onPress={()=>setAssetClass(item)} style={{padding:10,borderRadius:12,borderWidth:1,borderColor:item===assetClass?C.blue:C.border,backgroundColor:item===assetClass?C.blueSoft:C.card}}><Text style={{fontWeight:'700',color:C.ink}}>{item}</Text></Pressable>)}</View>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{visible.map(item=><Pressable key={item.symbol} onPress={()=>setSelectedInstrument(item)} style={{padding:10,borderRadius:12,borderWidth:1,borderColor:item.symbol===selectedInstrument.symbol?C.blue:C.border,backgroundColor:item.symbol===selectedInstrument.symbol?C.blueSoft:C.card}}><Text style={{fontWeight:'700',color:C.ink}}>{item.symbol}</Text></Pressable>)}</View>
  </ScrollView></Screen>;
}
