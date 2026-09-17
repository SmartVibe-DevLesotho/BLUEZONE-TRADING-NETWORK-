import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-mt5-device","Access-Control-Allow-Methods":"GET,POST,PATCH,DELETE,OPTIONS","Content-Type":"application/json"};
const out=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:H});
const text=(x:string,s=200)=>new Response(x,{status:s,headers:{...H,"Content-Type":"text/plain"}});
const enc=(v:unknown)=>encodeURIComponent(String(v??''));
const hash=async(v:string)=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');};
const client=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
async function user(req:Request){const a=req.headers.get('authorization');if(!a?.startsWith('Bearer '))return null;const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:a}}});const r=await sb.auth.getUser();return r.data.user??null;}
async function device(req:Request){const id=req.headers.get('x-mt5-device');const a=req.headers.get('authorization');if(!id||!a?.startsWith('Bearer '))return null;const d=await client().from('smartvibe_mt5_devices').select('*').eq('id',id).eq('token_hash',await hash(a.slice(7))).eq('enabled',true).maybeSingle();return d.data??null;}
async function activeDevice(req:Request){const u=await user(req);if(!u)return {u:null,d:null};const r=await client().from('smartvibe_mt5_devices').select('*').eq('user_id',u.id).eq('enabled',true).order('updated_at',{ascending:false}).limit(1).maybeSingle();return {u,d:r.data??null};}
async function waitResult(id:string,timeout=7000){const sb=client(),end=Date.now()+timeout;while(Date.now()<end){const r=await sb.from('smartvibe_mt5_commands').select('status,result').eq('id',id).maybeSingle();if(r.data?.status==='COMPLETED')return r.data.result??{};if(r.data?.status==='FAILED'||r.data?.status==='EXPIRED')throw new Error('MT5 command failed');await new Promise(r=>setTimeout(r,350));}throw new Error('MT5 terminal did not acknowledge the command in time');}
async function queue(d:any,u:string,type:string,payload:any){const r=await client().from('smartvibe_mt5_commands').insert({device_id:d.id,user_id:u,command_type:type,payload}).select('id').single();if(r.error)throw r.error;return await waitResult(r.data.id);}

Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:H});
 try{
  const url=new URL(req.url),path=url.pathname.replace(/\/functions\/v1\/mt5-gateway/,'').replace(/\/$/,'');
  const sb=client();
  if(path==='/register'&&req.method==='POST'){
   const u=await user(req);if(!u)return out({ok:false,error:'AUTH_REQUIRED'},401);
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
   const id=crypto.randomUUID(),r=await sb.from('smartvibe_mt5_devices').insert({id,user_id:u.id,name:'My MT5 terminal',token_hash:await hash(token)}).select('id,name').single();
   if(r.error)throw r.error;return out({ok:true,deviceId:id,deviceToken:token,warning:'Store this token in the MT5 Expert Advisor. It is shown once.'});
  }
  if(path==='/device/heartbeat'&&req.method==='POST'){
   const d=await device(req);if(!d)return text('UNAUTHORIZED',401);const b=await req.formData();const r=await sb.from('smartvibe_mt5_devices').update({connected:b.get('connected')==='1',trade_allowed:b.get('trade_allowed')==='1',account_login:Number(b.get('account_login')||0)||null,broker_server:String(b.get('broker_server')||''),currency:String(b.get('currency')||''),balance:Number(b.get('balance')||0),equity:Number(b.get('equity')||0),leverage:Number(b.get('leverage')||0),terminal_version:String(b.get('terminal_version')||''),last_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',d.id);return text(r.error?'ERROR':'OK',r.error?500:200);
  }
  if(path==='/device/next'&&req.method==='GET'){
   const d=await device(req);if(!d)return text('UNAUTHORIZED',401);const r=await sb.from('smartvibe_mt5_commands').select('id,command_type,payload').eq('device_id',d.id).eq('status','PENDING').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:true}).limit(1).maybeSingle();if(!r.data)return text('NONE');await sb.from('smartvibe_mt5_commands').update({status:'CLAIMED',claimed_at:new Date().toISOString()}).eq('id',r.data.id).eq('status','PENDING');const p=r.data.payload??{};if(r.data.command_type==='ORDER')return text(`ORDER|${r.data.id}|${p.symbol}|${p.order_type}|${p.lot}|${p.sl??0}|${p.tp??0}|${p.comment??''}`);if(r.data.command_type==='CLOSE')return text(`CLOSE|${r.data.id}|${p.ticket}`);if(r.data.command_type==='MODIFY')return text(`MODIFY|${r.data.id}|${p.ticket}|${p.sl??0}|${p.tp??0}`);return text(`PING|${r.data.id}|${p.action??''}|${p.symbol??''}`);
  }
  if(path==='/device/result'&&req.method==='POST'){
   const d=await device(req);if(!d)return text('UNAUTHORIZED',401);const b=await req.formData(),id=String(b.get('id')||'');const result={ok:String(b.get('ok')||'0')==='1',retcode:Number(b.get('retcode')||0),ticket:String(b.get('ticket')||''),price:Number(b.get('price')||0),bid:Number(b.get('bid')||0),ask:Number(b.get('ask')||0),message:String(b.get('message')||''),payload:String(b.get('payload')||'')};const r=await sb.from('smartvibe_mt5_commands').update({status:result.ok?'COMPLETED':'FAILED',result,completed_at:new Date().toISOString()}).eq('id',id).eq('device_id',d.id);return text(r.error?'ERROR':'OK',r.error?500:200);
  }
  const {u,d}=await activeDevice(req);if(!u||!d)return out({ok:false,error:'MT5_NOT_CONNECTED',mode:'LIVE_ONLY'},503);
  if(path==='/health'&&req.method==='GET')return out({ok:true,connected:d.connected&&!!d.last_seen_at&&Date.now()-new Date(d.last_seen_at).getTime()<15000,trade_allowed:d.trade_allowed,deviceId:d.id,account_login:d.account_login,broker_server:d.broker_server});
  if(path==='/account'&&req.method==='GET')return out({balance:d.balance,equity:d.equity,leverage:d.leverage,currency:d.currency,login:d.account_login,server:d.broker_server});
  if(path==='/positions'&&req.method==='GET'){const r=await queue(d,u.id,'PING',{action:'positions'});return out(r.payload?JSON.parse(r.payload):r);}
  if(path.startsWith('/price/')&&req.method==='GET'){const symbol=decodeURIComponent(path.slice(7)),r=await queue(d,u.id,'PING',{action:'price',symbol});return out(r.payload?JSON.parse(r.payload):r);}
  if(path.startsWith('/symbol/')&&req.method==='GET'){const symbol=decodeURIComponent(path.slice(8)),r=await queue(d,u.id,'PING',{action:'symbol',symbol});return out(r.payload?JSON.parse(r.payload):r);}
  if(path==='/order'&&req.method==='POST'){const p=Object.fromEntries(url.searchParams.entries()),r=await queue(d,u.id,'ORDER',{symbol:p.symbol,order_type:p.order_type,lot:Number(p.lot),sl:Number(p.sl||0),tp:Number(p.tp||0),comment:p.comment||'SMARTVIBE'});return out(r);}
  if(path.startsWith('/position/')&&req.method==='DELETE'){const ticket=path.split('/').pop(),r=await queue(d,u.id,'CLOSE',{ticket});return out(r);}
  if(path.startsWith('/position/')&&req.method==='PATCH'){const ticket=path.split('/').pop(),b=await req.json().catch(()=>({})),r=await queue(d,u.id,'MODIFY',{ticket,sl:Number(b.sl||0),tp:Number(b.tp||0)});return out(r);}
  return out({ok:false,error:'NOT_FOUND'},404);
 }catch(e){return out({ok:false,error:e instanceof Error?e.message:'MT5_GATEWAY_ERROR'},500);}
});
