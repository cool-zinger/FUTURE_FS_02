import {db} from './db.js';
import {sendMail,mailConfigured} from './mail.js';
import {id} from './security.js';
import {entitlement} from './plans.js';
let running=false;
export async function tick(){if(running)return;running=true;try{
for(const r of await db('reminders').whereNull('sent_at').where('due_at','<=',new Date()).limit(100)){
let deliver=false;await db.transaction(async k=>{const row=await k('reminders').where({id:r.id,sent_at:null}).forUpdate().first();if(!row)return;const task=await k(r.lead_id?'leads':'tasks').where({id:r.lead_id||r.task_id,workspace_id:r.workspace_id,archived:false}).whereNotIn('status',r.lead_id?['Won','Lost']:['Completed']).first();const member=await k('memberships').where({workspace_id:r.workspace_id,user_id:r.user_id}).first();if(task&&member){await k('notifications').insert({id:id(),workspace_id:r.workspace_id,user_id:r.user_id,title:(r.lead_id?'Follow-up due: ':'Task due: ')+task.name,body:r.lead_id?'A lead follow-up is due.':'Your '+task.priority.toLowerCase()+' priority task is due.'});deliver=true;}await k('reminders').where({id:r.id}).update({sent_at:new Date()});});
if(deliver&&r.email&&mailConfigured()){const u=await db('users').where({id:r.user_id,suspended:false}).first();if(u)await sendMail({to:u.email,subject:'LeadNest reminder',text:'A task or lead follow-up is due. Open '+process.env.APP_URL+'/app/tasks to review it.'}).catch(()=>{});}
}
for(const j of await db('email_jobs').where({status:'queued'}).limit(20)){
const claim=await db('email_jobs').where({id:j.id,status:'queued'}).update({status:'sending',updated_at:new Date()});if(!claim)continue;
const d=await db('email_drafts').where({id:j.draft_id,workspace_id:j.workspace_id}).first();const member=await db('memberships').where({workspace_id:j.workspace_id,user_id:j.user_id}).first();const user=await db('users').where({id:j.user_id,suspended:false}).first();const wsOwner=await db('workspaces').join('users','users.id','workspaces.owner_id').where('workspaces.id',j.workspace_id).select('users.suspended').first();const e=await entitlement(db,j.workspace_id);
if(!d||!member||!user||wsOwner?.suspended||e.limits.emails===0){await db('email_jobs').where({id:j.id}).update({status:'blocked',error:'Access or plan changed before delivery'});continue;}
try{await sendMail({to:d.recipient,subject:d.subject,text:d.body,messageId:j.message_id});await db('email_jobs').where({id:j.id}).update({status:'accepted',updated_at:new Date()});}catch{await db('email_jobs').where({id:j.id}).update({status:'uncertain',error:'Provider response uncertain. Check provider logs before sending a new draft.'});}
}
await db('email_jobs').where({status:'sending'}).where('updated_at','<',new Date(Date.now()-300000)).update({status:'uncertain',error:'Delivery interrupted. Check provider logs before sending a new draft.'});await db('payment_orders').where({status:'pending'}).where('expires_at','<=',new Date()).update({status:'expired'});
}catch(e){console.error('Background job failed:',e.code||e.name);}finally{running=false;}}
export function startWorker(){const timer=setInterval(tick,30000);timer.unref();tick();return timer;}
if(process.argv[1]?.endsWith('worker.js')){startWorker();setInterval(()=>{},60000);}

