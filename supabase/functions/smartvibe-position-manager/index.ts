import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const HEADERS={
  'Content-Type':'application/json',
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'content-type,x-smartvibe-automation-key',
  'Access-Control-Allow-Methods':'POST,OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});

Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:HEADERS});
  if(req.method!=='POST') return json({ok:false,error:'METHOD_NOT_ALLOWED',mode:'LIVE_ONLY'},405);
  try{
    const url=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url||!serviceKey) return json({ok:false,error:'BACKEND_NOT_CONFIGURED',mode:'LIVE_ONLY'},500);
    const db=createClient(url,serviceKey);
    const supplied=req.headers.get('x-smartvibe-automation-key')||'';
    const {data:automationKey,error:keyError}=await db.rpc('smartvibe_get_automation_key');
    if(keyError||!automationKey||supplied!==automationKey) return json({ok:false,error:'SMARTVIBE_AUTOMATION_UNAUTHORIZED',mode:'LIVE_ONLY'},401);

    // live-execute is the single execution boundary. It owns MT5 credentials,
    // so this scheduler never needs or exposes broker secrets.
    const endpoint=`${url}/functions/v1/live-execute`;
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-smartvibe-automation-key':supplied},body:JSON.stringify({action:'manage_positions',trigger:'cron'})});
    const result=await response.json().catch(()=>({ok:false,error:'INVALID_AUTOMATION_RESPONSE',mode:'LIVE_ONLY'}));
    return json(result,response.status);
  }catch(e){
    return json({ok:false,error:'SMARTVIBE_POSITION_MANAGER_INTERNAL_ERROR',detail:String(e),mode:'LIVE_ONLY'},500);
  }
});
