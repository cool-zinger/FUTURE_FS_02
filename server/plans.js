import {randomUUID} from 'node:crypto';
import {json} from './db.js';
export const plans=[
{id:'free',name:'Free',price_paise:0,limits:{seats:1,leads:100,contacts:100,pipelines:1,emails:0,invoices:0,ai:0,import:false,custom_pipeline:false,audit:false,dashboard:'Basic'}},
{id:'basic',name:'Basic',price_paise:49900,limits:{seats:3,leads:1000,contacts:1000,pipelines:1,emails:100,invoices:10,ai:50,import:true,custom_pipeline:false,audit:false,dashboard:'Standard'}},
{id:'pro',name:'Pro',price_paise:99900,limits:{seats:10,leads:10000,contacts:10000,pipelines:3,emails:1000,invoices:100,ai:300,import:true,custom_pipeline:true,audit:false,dashboard:'Advanced'}},
{id:'business',name:'Business',price_paise:199900,limits:{seats:25,leads:50000,contacts:50000,pipelines:10,emails:5000,invoices:500,ai:1000,import:true,custom_pipeline:true,audit:true,dashboard:'Advanced'}}];
export const trial={...plans[2],id:'trial',name:'14-day Pro trial',price_paise:100,limits:{...plans[2].limits,seats:3,leads:1000,contacts:1000,emails:20,ai:20,invoices:10}};
export function monthEnd(start){const d=new Date(start);const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d;}
export function date(x){return new Date(typeof x==='string'&&!x.endsWith('Z')?x.replace(' ','T')+'Z':x);}
export async function entitlement(k,w,at=new Date()){
const active=await k('subscriptions').where({workspace_id:w,status:'active'}).where('starts_at','<=',at).where('ends_at','>',at).orderBy('starts_at','desc').first();
const plan=active?json(active.snapshot):await k('plans').where({id:'free'}).first();
const limits=json(plan.limits);
return {plan:{...plan,limits},subscription:active||null,period:active?active.id:at.toISOString().slice(0,7),limits};
}
export async function lockWorkspace(k,w){const row=await k('workspaces').where({id:w}).forUpdate().first();if(!row)throw Object.assign(Error('Workspace not found'),{status:404});return row;}
export async function quota(k,w,metric,count=1){const e=await entitlement(k,w);const row=await k('usage_counters').where({workspace_id:w,period:e.period,metric}).first();const used=row?.used||0;if(used+count>e.limits[metric])throw Object.assign(Error('Your '+e.plan.name+' plan '+metric+' allowance is reached. View Billing to upgrade.'),{status:403});await k('usage_counters').insert({workspace_id:w,period:e.period,metric,used:used+count}).onConflict(['workspace_id','period','metric']).merge({used:used+count});return e;}
export async function createWorkspace(k,user,name){const id=randomUUID();await k('workspaces').insert({id,name,owner_id:user});await k('memberships').insert({workspace_id:id,user_id:user,role:'owner'});const pipeline=randomUUID();await k('pipelines').insert({id:pipeline,workspace_id:id,name:'Sales pipeline'});for(const [position,name] of ['New','Contacted','Qualified','Proposal','Won','Lost'].entries())await k('pipeline_stages').insert({id:randomUUID(),workspace_id:id,pipeline_id:pipeline,name,position,kind:name==='Won'?'won':name==='Lost'?'lost':'open'});return id;}

