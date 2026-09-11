import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const HEADERS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
const ENGINE='SMARTVIBE-CORE-1.3.0',MAX_QUOTE_AGE_MS=5000,MAX_ENTRY_DEVIATION_PIPS=2,REQUEST_TIMEOUT_MS=8000;
const pipSize=(symbol:string)=>symbol.includes('JPY')?0.01:(symbol.startsWith('XAU')||symbol.startsWith('XAG'))?0.1:(symbol.startsWith('BTC')||symbol.startsWith('ETH')||symbol.startsWith('US'))?1:0.0001;
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
const safeFetch=async(input:RequestInfo|URL,init:RequestInit={})=>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);try{return await fetch(input,{...init,signal:controller.signal});}finally{clearTimeout(timeout);}};
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:HEADERS});
 if(req.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED',mode:'LIVE_ONLY'},405);
 try{
  const authorization=req.headers.get('Authorization'); if(!authorization?.startsWith('Bearer '))return json({ok:false,error:'AUTH_REQUIRED',mode:'LIVE_ONLY'},401);
  const supabaseUrl=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anonKey=Deno.env.get('SUPABASE_ANON_KEY'),bridgeUrl=Deno.env.get('MT5_BRIDGE_URL'),bridgeToken=Deno.env.get('MT5_BRIDGE_TOKEN');
  if(!supabaseUrl||!serviceKey||!anonKey)return json({ok:false,error:'BACKEND_NOT_CONFIGURED',mode:'LIVE_ONLY'},500);
  const admin=createClient(supabaseUrl,serviceKey),userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}}});
  const {data:{user},error:authError}=await userClient.auth.getUser(); if(authError||!user)return json({ok:false,error:'INVALID_SESSION',mode:'LIVE_ONLY'},401);
  const body=await req.json().catch(()=>({})),signalId=typeof body.signalId==='string'?body.signalId:'',clientOrderId=typeof body.clientOrderId==='string'?body.clientOrderId:'',lot=Number(body.lot);
  if(!signalId||!/^[A-Za-z0-9._:-]{8,128}$/.test(clientOrderId)||!Number.isFinite(lot)||lot<=0)return json({ok:false,error:'INVALID_EXECUTION_REQUEST',mode:'LIVE_ONLY'},400);
  const {data:existing}=await admin.from('smartvibe_live_orders').select('id,signal_id,client_order_id,status,external_order_id,broker_entry,error,created_at,executed_at').eq('client_order_id',clientOrderId).maybeSingle();
  if(existing)return json({ok:existing.status==='EXECUTED',mode:'LIVE_ONLY',idempotent:true,order:existing});
  const now=new Date();
  const {data:licenses,error:licenseError}=await admin.from('user_licenses').select('licenses!inner(active,expires_at,revoked_at,plan_key)').eq('user_id',user.id);
  if(licenseError)return json({ok:false,error:'LICENSE_LOOKUP_FAILED',mode:'LIVE_ONLY'},500);
  const activeLicense=(licenses??[]).map((x:any)=>x.licenses).find((x:any)=>x?.active&&!x?.revoked_at&&(!x.expires_at||new Date(x.expires_at)>now));
  if(!activeLicense)return json({ok:false,error:'LICENSE_REQUIRED',mode:'LIVE_ONLY'},403);
  const {data:usage}=await admin.from('smartvibe_signal_usage').select('signal_id,user_id,license_id,status').eq('signal_id',signalId).eq('user_id',user.id).maybeSingle();
  if(!usage||usage.status!=='PENDING')return json({ok:false,error:'SIGNAL_NOT_EXECUTABLE',reason:'Signal entitlement is not pending.',mode:'LIVE_ONLY'},409);
  const {data:signal,error:signalError}=await admin.from('signals').select('id,symbol,direction,score,style,entry,sl,tp,data_status,data_timestamp,is_live,evidence,engine_version').eq('id',signalId).maybeSingle();
  if(signalError||!signal)return json({ok:false,error:'SIGNAL_NOT_FOUND',mode:'LIVE_ONLY'},404);
  const evidence=signal.evidence&&typeof signal.evidence==='object'?signal.evidence as Record<string,any>:{};
  const authority=evidence.authority as Record<string,any>|undefined;
  const coreApproved=signal.style==='SmartVibe Trading Network'&&signal.engine_version===ENGINE&&signal.is_live===true&&signal.data_status==='LIVE'&&['BUY','SELL'].includes(signal.direction)&&Number(signal.score)>=70&&authority?.methodologyAuthority==='smartvibe-core'&&authority?.approved===true&&evidence.canonicalMethodology==='SmartVibe Trading Network'&&evidence.supportingMechanics?.independentSignal===false;
  if(!coreApproved)return json({ok:false,error:'SMARTVIBE_AUTHORITY_BLOCKED',mode:'LIVE_ONLY'},403);
  const {data:outcome}=await admin.from('smartvibe_signal_outcomes').select('status,direction,entry').eq('signal_id',signalId).maybeSingle();
  if(!outcome||outcome.status!=='OPEN')return json({ok:false,error:'SIGNAL_CLOSED',mode:'LIVE_ONLY'},409);
  if(!bridgeUrl)return json({ok:false,error:'MT5_BRIDGE_NOT_CONFIGURED',mode:'LIVE_ONLY'},503);
  const headers:Record<string,string>={accept:'application/json'}; if(bridgeToken)headers.authorization=`Bearer ${bridgeToken}`; const base=bridgeUrl.replace(/\/$/,'');
  let healthResponse:Response; try{healthResponse=await safeFetch(`${base}/health`,{headers});}catch{return json({ok:false,error:'MT5_BRIDGE_UNAVAILABLE',mode:'LIVE_ONLY'},503);}
  if(!healthResponse.ok)return json({ok:false,error:'MT5_BRIDGE_UNAVAILABLE',mode:'LIVE_ONLY'},503);
  const health=await healthResponse.json().catch(()=>null) as Record<string,any>|null; if(!health?.connected||!health?.trade_allowed)return json({ok:false,error:'MT5_TRADING_NOT_AVAILABLE',mode:'LIVE_ONLY'},503);
  let quoteResponse:Response; try{quoteResponse=await safeFetch(`${base}/price/${encodeURIComponent(signal.symbol)}`,{headers});}catch{return json({ok:false,error:'MT5_QUOTE_UNAVAILABLE',mode:'LIVE_ONLY'},503);}
  if(!quoteResponse.ok)return json({ok:false,error:'MT5_QUOTE_UNAVAILABLE',mode:'LIVE_ONLY'},503);
  const quote=await quoteResponse.json().catch(()=>null) as Record<string,any>|null,bid=Number(quote?.bid),ask=Number(quote?.ask),quoteTime=Number(quote?.time);
  if(!Number.isFinite(bid)||!Number.isFinite(ask)||ask<=bid||!Number.isFinite(quoteTime))return json({ok:false,error:'INVALID_MT5_QUOTE',mode:'LIVE_ONLY'},503);
  const quoteAge=Date.now()-quoteTime*1000; if(quoteAge<0||quoteAge>MAX_QUOTE_AGE_MS)return json({ok:false,error:'STALE_MT5_QUOTE',mode:'LIVE_ONLY'},409);
  const executionPrice=signal.direction==='BUY'?ask:bid,deviationPips=Math.abs(executionPrice-Number(signal.entry))/pipSize(signal.symbol); if(!Number.isFinite(deviationPips)||deviationPips>MAX_ENTRY_DEVIATION_PIPS)return json({ok:false,error:'ENTRY_DEVIATION_BLOCKED',deviationPips,maxEntryDeviationPips:MAX_ENTRY_DEVIATION_PIPS,mode:'LIVE_ONLY'},409);
  let symbolResponse:Response; try{symbolResponse=await safeFetch(`${base}/symbol/${encodeURIComponent(signal.symbol)}`,{headers});}catch{return json({ok:false,error:'MT5_SYMBOL_UNAVAILABLE',mode:'LIVE_ONLY'},503);}
  if(!symbolResponse.ok)return json({ok:false,error:'MT5_SYMBOL_UNAVAILABLE',mode:'LIVE_ONLY'},503);
  const spec=await symbolResponse.json().catch(()=>null) as Record<string,any>|null,minLot=Number(spec?.volume_min),maxLot=Number(spec?.volume_max),step=Number(spec?.volume_step);
  if(!Number.isFinite(minLot)||!Number.isFinite(maxLot)||!Number.isFinite(step)||step<=0||lot<minLot||lot>maxLot)return json({ok:false,error:'LOT_SIZE_BLOCKED',minLot,maxLot,step,mode:'LIVE_ONLY'},400);
  const stepUnits=Math.round((lot-minLot)/step); if(Math.abs(lot-(minLot+stepUnits*step))>Math.max(step*1e-6,1e-10))return json({ok:false,error:'LOT_STEP_BLOCKED',minLot,maxLot,step,mode:'LIVE_ONLY'},400);
  const {data:claimed,error:claimError}=await admin.from('smartvibe_live_orders').insert({user_id:user.id,signal_id:signalId,client_order_id:clientOrderId,symbol:signal.symbol,direction:signal.direction,lot,requested_entry:Number(signal.entry),sl:signal.sl,tp:signal.tp,status:'CLAIMED'}).select('id,signal_id,client_order_id,status').single();
  if(claimError){
   if(claimError.code==='23505'){
    const {data:duplicateByClient}=await admin.from('smartvibe_live_orders').select('id,signal_id,client_order_id,status,external_order_id,broker_entry,error,created_at,executed_at').eq('client_order_id',clientOrderId).maybeSingle();
    if(duplicateByClient)return json({ok:duplicateByClient.status==='EXECUTED',mode:'LIVE_ONLY',idempotent:true,order:duplicateByClient});
    const {data:duplicateBySignal}=await admin.from('smartvibe_live_orders').select('id,signal_id,client_order_id,status,external_order_id,broker_entry,error,created_at,executed_at').eq('signal_id',signalId).in('status',['CLAIMED','EXECUTED','AMBIGUOUS']).maybeSingle();
    if(duplicateBySignal)return json({ok:duplicateBySignal.status==='EXECUTED',error:duplicateBySignal.status==='CLAIMED'?'SIGNAL_EXECUTION_IN_PROGRESS':'SIGNAL_REQUIRES_RECONCILIATION',mode:'LIVE_ONLY',reconciliationRequired:duplicateBySignal.status==='AMBIGUOUS',order:duplicateBySignal},409);
   }
   return json({ok:false,error:'LIVE_ORDER_CLAIM_FAILED',mode:'LIVE_ONLY'},500);
  }
  const orderUrl=new URL(`${base}/order`); orderUrl.searchParams.set('symbol',signal.symbol);orderUrl.searchParams.set('lot',String(lot));orderUrl.searchParams.set('order_type',signal.direction==='BUY'?'buy':'sell');orderUrl.searchParams.set('sl',String(signal.sl??0));orderUrl.searchParams.set('tp',String(signal.tp??0));orderUrl.searchParams.set('comment',`SV:${clientOrderId}`.slice(0,31));
  let brokerResponse:Response; try{brokerResponse=await safeFetch(orderUrl.toString(),{method:'POST',headers});}catch{await admin.from('smartvibe_live_orders').update({status:'AMBIGUOUS',error:'No broker acknowledgement received.',updated_at:new Date().toISOString()}).eq('id',claimed.id);return json({ok:false,error:'BROKER_ACKNOWLEDGEMENT_MISSING',mode:'LIVE_ONLY',reconciliationRequired:true,clientOrderId},502);}
  const brokerBody=await brokerResponse.json().catch(()=>null) as Record<string,any>|null;
  if(!brokerResponse.ok){await admin.from('smartvibe_live_orders').update({status:'REJECTED',bridge_response:brokerBody??{},error:`Bridge HTTP ${brokerResponse.status}`,updated_at:new Date().toISOString()}).eq('id',claimed.id);return json({ok:false,error:'BROKER_ORDER_REJECTED',mode:'LIVE_ONLY',clientOrderId},502);}
  const retcode=Number(brokerBody?.retcode),externalOrderId=brokerBody?.ticket!=null?String(brokerBody.ticket):brokerBody?.order!=null?String(brokerBody.order):null,brokerPrice=Number(brokerBody?.price);
  if(![10009,10010].includes(retcode)||!externalOrderId||!Number.isFinite(brokerPrice)){await admin.from('smartvibe_live_orders').update({status:'REJECTED',bridge_response:brokerBody??{},error:`MT5 retcode ${String(brokerBody?.retcode??'unknown')}`,updated_at:new Date().toISOString()}).eq('id',claimed.id);return json({ok:false,error:'BROKER_EXECUTION_REJECTED',mode:'LIVE_ONLY',clientOrderId},502);}
  const finalized=await admin.rpc('finalize_smartvibe_live_execution',{p_signal_id:signalId,p_user_id:user.id});
  if(finalized.error||finalized.data!==true){await admin.from('smartvibe_live_orders').update({status:'AMBIGUOUS',external_order_id:externalOrderId,broker_entry:brokerPrice,bridge_response:brokerBody??{},error:'EXECUTED_BUT_ENTITLEMENT_FINALIZATION_FAILED',updated_at:new Date().toISOString()}).eq('id',claimed.id);return json({ok:false,error:'EXECUTED_BUT_ENTITLEMENT_FINALIZATION_FAILED',mode:'LIVE_ONLY',clientOrderId,signalId,externalOrderId,brokerPrice,reconciliationRequired:true},500);}
  const {error:executionLedgerError}=await admin.from('smartvibe_live_orders').update({status:'EXECUTED',external_order_id:externalOrderId,broker_entry:brokerPrice,bridge_response:brokerBody??{},executed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',claimed.id);
  if(executionLedgerError)return json({ok:false,error:'EXECUTED_BUT_LEDGER_UPDATE_FAILED',mode:'LIVE_ONLY',clientOrderId,signalId,externalOrderId,brokerPrice,reconciliationRequired:true},500);
  return json({ok:true,mode:'LIVE_ONLY',clientOrderId,signalId,externalOrderId,brokerPrice,direction:signal.direction,lot,sl:signal.sl,tp:signal.tp});
 }catch{return json({ok:false,error:'LIVE_EXECUTION_INTERNAL_ERROR',mode:'LIVE_ONLY'},500);}
});
