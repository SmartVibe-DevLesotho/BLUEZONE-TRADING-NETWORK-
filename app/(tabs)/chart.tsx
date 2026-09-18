import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Screen, Card, C, Badge } from '@/components/ui';
import { getMarketQuotes, type MarketQuote } from '@/lib/backend';
import { instruments } from '@/instruments';
import { useTrading } from '@/context/TradingContext';

const classes = ['Forex','Metals','Crypto','Indices','Deriv'] as const;

function CandlestickChart({ quote }: { quote: MarketQuote }) {
  const candles=(quote.candles??[]).slice(-120);
  if(candles.length<2) return <Text style={{color:C.muted,marginTop:12}}>Live OHLC history is not available yet.</Text>;
  const width=760,height=320,padX=10,padY=18;
  const highs=candles.map(c=>c.high), lows=candles.map(c=>c.low);
  const min=Math.min(...lows),max=Math.max(...highs),span=max-min||1;
  const bodyWidth=Math.max(2,Math.min(7,(width-padX*2)/candles.length*.62));
  const xStep=(width-padX*2)/(candles.length-1);
  const y=(v:number)=>height-padY-((v-min)/span)*(height-padY*2);
  return <View style={{marginTop:14,borderRadius:14,overflow:'hidden',backgroundColor:'#07101d',borderWidth:1,borderColor:C.border}}>
    <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={320} preserveAspectRatio="none">
      <Line x1={padX} y1={height-padY} x2={width-padX} y2={height-padY} stroke={C.border} strokeWidth="1"/>
      <Line x1={padX} y1={padY} x2={padX} y2={height-padY} stroke={C.border} strokeWidth="1"/>
      {candles.map((c,i)=>{
        const x=padX+i*xStep, up=c.close>=c.open, top=y(Math.max(c.open,c.close)), bottom=y(Math.min(c.open,c.close));
        return <View key={c.time}>
          <Line x1={x} y1={y(c.high)} x2={x} y2={y(c.low)} stroke={up?C.green:C.red} strokeWidth="1.4"/>
          <Rect x={x-bodyWidth/2} y={Math.min(top,bottom)} width={bodyWidth} height={Math.max(2,Math.abs(bottom-top))} fill={up?C.green:C.red}/>
        </View>;
      })}
    </Svg>
  </View>;
}

function SignalRail({ quote }: { quote: MarketQuote }) {
  const candles=quote.candles??[];
  const last=candles.at(-1);
  if(!last) return null;
  const change=last.close-last.open;
  const state=change>0?'BULLISH CANDLE':change<0?'BEARISH CANDLE':'NEUTRAL CANDLE';
  return <Card>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
      <Text style={{fontWeight:'900',fontSize:18,color:C.ink}}>LIVE MARKET FEED</Text>
      <Badge label="OHLC" tone="positive"/>
    </View>
    <Text style={{color:C.muted,marginTop:6,lineHeight:20}}>Real provider OHLC is rendered as candlesticks. No blue-line or synthetic candle fallback is used.</Text>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:12}}>
      <Text style={{color:C.slate}}>O <Text style={{fontWeight:'900',color:C.ink}}>{last.open}</Text></Text>
      <Text style={{color:C.slate}}>H <Text style={{fontWeight:'900',color:C.ink}}>{last.high}</Text></Text>
      <Text style={{color:C.slate}}>L <Text style={{fontWeight:'900',color:C.ink}}>{last.low}</Text></Text>
      <Text style={{color:C.slate}}>C <Text style={{fontWeight:'900',color:C.ink}}>{last.close}</Text></Text>
    </View>
    <Text style={{color:change>=0?C.green:C.red,fontWeight:'900',marginTop:10}}>{state}</Text>
  </Card>;
}

export default function Chart(){
  const{selectedInstrument,setSelectedInstrument}=useTrading();
  const[assetClass,setAssetClass]=useState<(typeof classes)[number]>(selectedInstrument.class);
  const[quote,setQuote]=useState<MarketQuote|null>(null);
  const[loading,setLoading]=useState(true); const[error,setError]=useState('');
  const visible=useMemo(()=>instruments.filter(i=>i.class===assetClass).slice(0,30),[assetClass]);

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{const result=await getMarketQuotes([selectedInstrument.symbol]);setQuote(result.quotes?.[0]??null);if(!result.quotes?.[0])setError(`No live market data is currently available for ${selectedInstrument.symbol}.`);}
    catch(e:any){setQuote(null);setError(e?.message??'Unable to load live market data.');}
    finally{setLoading(false);}
  },[selectedInstrument.symbol]);

  useEffect(()=>{load();const timer=setInterval(load,15000);return()=>clearInterval(timer);},[load]);
  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <Text style={{fontSize:30,fontWeight:'900',color:C.ink}}>Live MT5-Style Chart</Text>
    <Text style={{color:C.muted,marginTop:4}}>Live OHLC candlesticks • 15-second refresh • no demo/simulated candles.</Text>
    <Card elevated>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <View><Text style={{fontWeight:'900',color:C.ink}}>Instrument</Text><Text style={{fontSize:24,fontWeight:'900',marginTop:6,color:C.ink}}>{selectedInstrument.symbol}</Text></View>
        {quote?<Badge label="LIVE" tone="positive"/>:<Badge label="OFFLINE" tone="neutral"/>}
      </View>
      {loading?<ActivityIndicator style={{marginTop:18}} color={C.cyan}/>:quote?<><Text style={{fontSize:28,fontWeight:'900',marginTop:12,color:C.ink}}>{Number.isFinite(quote.price)?quote.price.toLocaleString():'—'}</Text><Text style={{color:(quote.change??0)>=0?C.green:C.red,marginTop:5}}>{quote.change===null?'':`${quote.change>=0?'+':''}${quote.change}%`}</Text><CandlestickChart quote={quote}/><Text style={{color:C.muted,fontSize:12,marginTop:8}}>Source: {quote.source} • as of {quote.asOf?new Date(quote.asOf).toLocaleTimeString(): '—'}</Text></>:null}
      {error?<Text style={{color:C.red,marginTop:10,lineHeight:20}}>{error}</Text>:null}
    </Card>
    {quote?<SignalRail quote={quote}/>:null}
    <Text style={{fontWeight:'900',fontSize:18,marginBottom:8,color:C.ink}}>Asset class</Text>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12}}>{classes.map(item=><Pressable key={item} onPress={()=>setAssetClass(item)} style={{padding:10,borderRadius:12,borderWidth:1,borderColor:item===assetClass?C.blue:C.border,backgroundColor:item===assetClass?C.blueSoft:C.card}}><Text style={{fontWeight:'700',color:C.ink}}>{item}</Text></Pressable>)}</View>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{visible.map(item=><Pressable key={item.symbol} onPress={()=>setSelectedInstrument(item)} style={{padding:10,borderRadius:12,borderWidth:1,borderColor:item.symbol===selectedInstrument.symbol?C.blue:C.border,backgroundColor:item.symbol===selectedInstrument.symbol?C.blueSoft:C.card}}><Text style={{fontWeight:'700',color:C.ink}}>{item.symbol}</Text></Pressable>)}</View>
  </ScrollView></Screen>;
}
