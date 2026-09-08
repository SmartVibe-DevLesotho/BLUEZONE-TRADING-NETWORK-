import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
function randomHex(bytes=18){const data=new Uint8Array(bytes);crypto.getRandomValues(data);return Array.from(data).map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();}
async function sha256(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');}
const db=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const plans:Record<string,{name:string,limit:number}>={professional:{name:'Professional',limit:5},advanced:{name:'Advanced',limit:10},elite:{name:'Premium Pro / Elite',limit:20}};
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors}); if(req.method!=='POST')return json({error:'Method not allowed.'},405);
  try{
    const auth=req.headers.get('Authorization'); if(!auth?.startsWith('Bearer '))return json({error:'Authentication required.'},401);
    const supabase=db(); const {data,error}=await supabase.auth.getUser(auth.slice(7)); if(error||!data.user)return json({error:'Invalid session.'},401);
    const {data:owner,error:ownerError}=await supabase.from('platform_admins').select('user_id').eq('user_id',data.user.id).maybeSingle(); if(ownerError)throw ownerError; if(!owner)return json({error:'Administration access denied.'},403);
    const body=await req.json().catch(()=>({}));
    if(body.action==='list'){
      const {data:licenses,error}=await supabase.from('licenses').select('id,label,plan_key,active,expires_at,max_activations,activation_count,issued_at,revoked_at').eq('issued_by',data.user.id).order('issued_at',{ascending:false}).limit(100); if(error)throw error; return json({licenses:licenses??[]});
    }
    if(body.action==='revoke'){
      const id=typeof body.licenseId==='string'?body.licenseId.trim():''; if(!id)return json({error:'License record is required.'},400);
      const {data:revoked,error:revokeError}=await supabase.from('licenses').update({active:false,revoked_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('issued_by',data.user.id).select('id').maybeSingle(); if(revokeError)throw revokeError; return json({ok:Boolean(revoked),message:revoked?'Token revoked.':'Token not found.'});
    }
    if(body.action!=='issue')return json({error:'Unsupported administration action.'},400);
    const planKey=typeof body.planKey==='string'&&plans[body.planKey]?body.planKey:'professional'; const plan=plans[planKey];
    const durationDays=Math.min(365,Math.max(1,Math.floor(Number(body.durationDays)||30))); const token=`SVTN-${randomHex()}`; const tokenHash=await sha256(token); const expiresAt=new Date(Date.now()+durationDays*86400000).toISOString();
    const {data:license,error:insertError}=await supabase.from('licenses').insert({token_hash:tokenHash,plan_key:planKey,active:true,expires_at:expiresAt,max_activations:1,activation_count:0,issued_by:data.user.id,label:typeof body.label==='string'?body.label.trim().slice(0,120):plan.name,issued_at:new Date().toISOString(),updated_at:new Date().toISOString()}).select('id,plan_key,expires_at,max_activations').single();
    if(insertError)throw insertError; return json({token,plan:{key:planKey,name:plan.name,dailySignalLimit:plan.limit},expiresAt,maxActivations:1,license});
  }catch(error){console.error(error);return json({error:'Secure administration service is temporarily unavailable.'},500);}
});
