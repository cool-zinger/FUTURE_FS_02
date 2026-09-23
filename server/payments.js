import {Router} from 'express';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {db,json} from './db.js';
import {id,fail,owner,audit,hash} from './security.js';
import {lockWorkspace,entitlement,trial,monthEnd,date} from './plans.js';
import {providerRequest,merchantIdentity} from './razorpay.js';
export const router=Router();
export const provider=()=>process.env.PAYMENT_PROVIDER||'sandbox';
export function signatureValid(raw,signature,secret){if(!secret||typeof signature!=='string'||!/^[a-f0-9]{64}$/i.test(signature))return false;return timingSafeEqual(Buffer.from(signature,'hex'),createHmac('sha256',secret).update(raw).digest());}
export const razor=providerRequest;
export async function activate(k,o,p,at=new Date(Math.floor(Date.now()/1000)*1000)){
const ws=await lockWorkspace(k,o.workspace_id);
if(o.plan_id==='trial'&&ws.trial_used)fail('Trial has already been used',409);
const existing=await k('subscriptions').where({payment_id:p.id}).first();if(existing)return;
const terms=await k('subscriptions').where({workspace_id:o.workspace_id,status:'active'}).where('ends_at','>',at).orderBy('ends_at','desc');
if(o.plan_id==='trial'&&terms.length)fail('Trial is available only without an active paid term',409);
const start=terms.length?date(terms[0].ends_at):at;
const end=o.plan_id==='trial'?new Date(start.getTime()+14*86400000):monthEnd(start);
await k('subscriptions').insert({id:id(),workspace_id:o.workspace_id,plan_id:o.plan_id==='trial'?'pro':o.plan_id,kind:o.plan_id==='trial'?'trial':'paid',status:'active',starts_at:start,ends_at:end,snapshot:o.snapshot,payment_id:p.id});
if(o.plan_id==='trial')await k('workspaces').where({id:o.workspace_id}).update({trial_used:true});
await k('billing_receipts').insert({id:id(),workspace_id:o.workspace_id,payment_id:p.id,number:'LN-'+p.id.slice(0,12).toUpperCase(),details:JSON.stringify({plan:json(o.snapshot).name,amount_paise:p.amount_paise,currency:p.currency,starts_at:start,ends_at:end,provider:o.provider,test:o.provider==='sandbox'||process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')})});
}
export async function processEvent(event,eventId,payloadHash){
return db.transaction(async k=>{
const found=await k('payment_orders').where({provider_order_id:event.order_id}).first();if(!found)fail('Unknown payment order',404);
await lockWorkspace(k,found.workspace_id);
if(await k('webhook_events').where({id:eventId}).first())return {duplicate:true};
const o=await k('payment_orders').where({id:found.id}).forUpdate().first();
if(event.provider!==o.provider||event.merchant!==o.merchant_id||event.currency!==o.currency||event.amount!==o.amount_paise)fail('Payment verification mismatch',400);
let p=await k('payments').where({order_id:o.id}).first();
if(event.status==='captured'){
if(!p){p={id:id(),workspace_id:o.workspace_id,order_id:o.id,provider_payment_id:event.payment_id,amount_paise:o.amount_paise,currency:o.currency,status:'captured',provider:o.provider,is_test:o.provider==='sandbox'||!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_'),paid_at:new Date()};await k('payments').insert(p);await k('payment_orders').where({id:o.id}).update({status:'paid'});await activate(k,o,p);}
}else if(['refunded','disputed'].includes(event.status)){
if(!p){p={id:id(),workspace_id:o.workspace_id,order_id:o.id,provider_payment_id:event.payment_id,amount_paise:o.amount_paise,currency:o.currency,status:event.status,provider:o.provider,is_test:o.provider==='sandbox'||!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_'),paid_at:null};await k('payments').insert(p);}
await k('payments').where({id:p.id}).update({status:event.status});await k('payment_orders').where({id:o.id}).update({status:event.status});await k('subscriptions').where({payment_id:p.id}).update({status:'revoked'});
}else if(['failed','pending','expired','cancelled'].includes(event.status)&&!p){await k('payment_orders').where({id:o.id}).update({status:event.status});}
await k('webhook_events').insert({id:eventId,provider:o.provider,event:event.status,payload_hash:payloadHash,processed_at:new Date()});return {ok:true};
});}
export async function webhook(req,res){
const raw=req.body;const secret=provider()==='sandbox'?process.env.SANDBOX_WEBHOOK_SECRET:process.env.RAZORPAY_WEBHOOK_SECRET;
if(!signatureValid(raw,req.get('x-razorpay-signature'),secret))fail('Invalid webhook signature',400);
let body;try{body=JSON.parse(raw.toString());}catch{fail('Invalid event');}
let event;
if(provider()==='sandbox'){if(process.env.NODE_ENV==='production')fail('Sandbox callbacks disabled',403);event=z.object({provider:z.literal('sandbox'),order_id:z.string(),merchant:z.literal('local-sandbox'),currency:z.literal('INR'),amount:z.number().int(),payment_id:z.string(),status:z.enum(['captured','failed','pending','expired','cancelled','refunded','disputed'])}).parse(body);}
else{
if(process.env.RAZORPAY_ACCOUNT_ID&&body.account_id!==process.env.RAZORPAY_ACCOUNT_ID)fail('Merchant mismatch',400);
const candidate=body.payload?.payment?.entity;const dispute=body.payload?.dispute?.entity;const refund=body.payload?.refund?.entity;const pid=candidate?.id||dispute?.payment_id||refund?.payment_id;
if(!pid)return res.json({ignored:true});
const p=await razor('payments/'+encodeURIComponent(pid));const o=await razor('orders/'+encodeURIComponent(p.order_id));
if(o.currency!==p.currency||o.amount!==p.amount)fail('Provider order mismatch');
let status=p.status;
if(body.event?.startsWith('payment.dispute.')){if(['payment.dispute.closed','payment.dispute.won'].includes(body.event))return res.json({review:'Dispute resolved; owner review required before restoring access'});status='disputed';}
if(p.amount_refunded>=p.amount)status='refunded';
if(status==='captured'&&(o.status!=='paid'||o.amount_paid!==o.amount))fail('Order not fully paid');
event={provider:'razorpay',merchant:merchantIdentity(),order_id:p.order_id,currency:p.currency,amount:p.amount,payment_id:p.id,status};
}
res.json(await processEvent(event,req.get('x-razorpay-event-id')||hash(raw),hash(raw)));
}
router.get('/billing',async(req,res)=>{const e=await entitlement(db,req.w);const counts={};for(const table of ['leads','contacts']){const [{n}]=await db(table).where({workspace_id:req.w,archived:false}).count('* as n');counts[table]=Number(n);}const [{n}]=await db('memberships').where({workspace_id:req.w}).count('* as n');counts.seats=Number(n);for(const u of await db('usage_counters').where({workspace_id:req.w,period:e.period}))counts[u.metric]=u.used;
res.json({...e,usage:counts,provider:provider(),test:provider()==='sandbox'||process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_'),trialUsed:!!(await db('workspaces').where({id:req.w}).first()).trial_used,...(req.role==='owner'?{subscriptions:await db('subscriptions').where({workspace_id:req.w}).orderBy('starts_at','desc'),orders:await db('payment_orders').where({workspace_id:req.w}).orderBy('created_at','desc').limit(100),payments:await db('payments').where({workspace_id:req.w}).orderBy('created_at','desc').limit(100),receipts:await db('billing_receipts').where({workspace_id:req.w}).orderBy('created_at','desc')}: {})});});
router.post('/billing/orders',async(req,res)=>{owner(req);const b=z.object({plan:z.enum(['basic','pro','business','trial'])}).strict().parse(req.body);let order;await db.transaction(async k=>{const ws=await lockWorkspace(k,req.w);if(b.plan==='trial'){if(ws.trial_used)fail('This account has already used its trial');if(await k('subscriptions').where({workspace_id:req.w,status:'active'}).where('ends_at','>',new Date()).first())fail('Trial unavailable during an active paid term');if(provider()==='razorpay'&&process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_')&&process.env.PRODUCTION_TRIAL_APPROVED!=='true')fail('The ₹1 trial is awaiting merchant approval');}
const outstanding=await k('payment_orders').where({workspace_id:req.w,status:'pending'}).where('expires_at','>',new Date()).first();if(outstanding){if(outstanding.plan_id===b.plan){order=outstanding;return;}fail('Complete or cancel the pending order first',409);}
if(await k('subscriptions').where({workspace_id:req.w,status:'active'}).where('starts_at','>',new Date()).first())fail('A prepaid plan is already scheduled',409);
const p=b.plan==='trial'?trial:await k('plans').where({id:b.plan}).first();order={id:id(),workspace_id:req.w,provider:provider(),merchant_id:provider()==='sandbox'?'local-sandbox':merchantIdentity(),plan_id:b.plan,amount_paise:p.price_paise,currency:'INR',status:'pending',snapshot:JSON.stringify({...p,limits:json(p.limits)}),expires_at:new Date(Date.now()+30*60000)};
if(provider()==='sandbox'){if(process.env.NODE_ENV==='production')fail('Sandbox mode is not enabled in production');order.provider_order_id='test_order_'+id();}
else{if(!Number.isInteger(order.amount_paise)||order.amount_paise<100)fail('Minimum payment amount is 100 paise',400);const po=await razor('orders','POST',{amount:order.amount_paise,currency:'INR',receipt:order.id,partial_payment:false,notes:{leadnest_order:order.id}});if(po.amount!==order.amount_paise||po.currency!=='INR')fail('Provider returned a mismatched order',502);order.provider_order_id=po.id;}
await k('payment_orders').insert(order);await audit(k,req,'billing.order',order.id);});res.status(201).json({id:order.id,provider_order_id:order.provider_order_id,order_id:order.provider_order_id,amount:order.amount_paise,currency:order.currency,provider:order.provider,key:process.env.RAZORPAY_KEY_ID,test:provider()==='sandbox'||process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')});});
router.post('/billing/orders/:id/cancel',async(req,res)=>{owner(req);await db('payment_orders').where({id:req.params.id,workspace_id:req.w,status:'pending'}).update({status:'cancelled'});res.json({ok:true,message:'Order closed locally. A late verified payment will still be honoured.'});});
router.post('/billing/sandbox/:id',async(req,res)=>{owner(req);if(provider()!=='sandbox'||process.env.NODE_ENV==='production')fail('Sandbox simulation unavailable',403);const b=z.object({status:z.enum(['captured','failed','refunded','disputed'])}).parse(req.body);const o=await db('payment_orders').where({id:req.params.id,workspace_id:req.w,provider:'sandbox'}).first();if(!o)fail('Order not found',404);const event={provider:'sandbox',merchant:'local-sandbox',order_id:o.provider_order_id,currency:'INR',amount:o.amount_paise,payment_id:'test_pay_'+o.id,status:b.status};res.json(await processEvent(event,id(),hash(JSON.stringify(event))));});
router.post('/billing/verify',async(req,res)=>{owner(req);const b=z.object({order_id:z.string().min(1),payment_id:z.string().min(1),signature:z.string().min(1)}).parse({order_id:req.body.razorpay_order_id??req.body.order_id,payment_id:req.body.razorpay_payment_id??req.body.payment_id,signature:req.body.razorpay_signature??req.body.signature});const o=await db('payment_orders').where({workspace_id:req.w,provider_order_id:b.order_id,provider:'razorpay'}).first();if(!o||o.merchant_id!==merchantIdentity()||!signatureValid(o.provider_order_id+'|'+b.payment_id,b.signature,process.env.RAZORPAY_KEY_SECRET))fail('Payment confirmation could not be verified');const p=await razor('payments/'+encodeURIComponent(b.payment_id));const po=await razor('orders/'+encodeURIComponent(o.provider_order_id));if(p.order_id!==o.provider_order_id||p.currency!==o.currency||p.amount!==o.amount_paise||p.status!=='captured'||po.currency!==o.currency||po.status!=='paid'||po.amount!==o.amount_paise||po.amount_paid!==o.amount_paise)fail('Payment is pending verification');res.json({success:true,...await processEvent({provider:'razorpay',merchant:o.merchant_id,order_id:p.order_id,currency:p.currency,amount:p.amount,payment_id:p.id,status:'captured'},'verify-'+p.id,hash(JSON.stringify(p)))});});
router.post('/billing/cancel',async(req,res)=>{owner(req);await db.transaction(async k=>{await lockWorkspace(k,req.w);const e=await entitlement(k,req.w);if(e.subscription)await k('subscriptions').where({id:e.subscription.id}).update({cancel_at_end:true});await audit(k,req,'subscription.cancel-at-end',e.subscription?.id||'free');});res.json({message:'Current access remains until expiry. No automatic debit is scheduled. Prepaid future terms remain available.'});});


