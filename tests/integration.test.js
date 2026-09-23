import 'dotenv/config';
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {createHmac} from 'node:crypto';
process.env.NODE_ENV='test';process.env.MAIL_MODE='outbox';process.env.DB_NAME='leadnest_test';process.env.PAYMENT_PROVIDER='sandbox';process.env.SANDBOX_WEBHOOK_SECRET='test-only-webhook-secret';process.env.APP_URL='http://127.0.0.1:3000';
const {db}=await import('../server/db.js');
const {app,errorHandler}=await import('../server/app.js');app.use(errorHandler);
const {plans,monthEnd,entitlement}=await import('../server/plans.js');
const {sentMail}=await import('../server/mail.js');
const {id,hash}=await import('../server/security.js');
const {processEvent}=await import('../server/payments.js');
let a,b,member,lead;
async function account(email,name='Test Person'){const agent=request.agent(app);const password='A secure test password!';const signup=await agent.post('/api/auth/signup').send({email,name,password,workspace:name+' workspace'});assert.equal(signup.status,201,JSON.stringify(signup.body));const mail=sentMail.findLast(m=>m.to===email);const raw=mail.text.split('token=')[1];assert.equal((await agent.post('/api/auth/verify').send({token:raw})).status,200);assert.equal((await agent.post('/api/auth/verify').send({token:raw})).status,400);const login=await agent.post('/api/auth/login').send({email,password,remember:true});assert.equal(login.status,200);assert.match(login.headers['set-cookie'][0],/HttpOnly/);assert.match(login.headers['set-cookie'][0],/Max-Age/);const me=await agent.get('/api/auth/me');return {agent,email,password,csrf:login.body.csrf,uid:me.body.user.id,w:me.body.workspaces[0].id};}
function call(u,method,path,body,w=u.w){return u.agent[method]('/api'+path).set('X-CSRF-Token',u.csrf).set('X-Workspace-ID',w).send(body);}
async function buy(u,plan='trial'){const order=await call(u,'post','/workspace/billing/orders',{plan});assert.equal(order.status,201,JSON.stringify(order.body));const paid=await call(u,'post','/workspace/billing/sandbox/'+order.body.id,{status:'captured'});assert.equal(paid.status,200,JSON.stringify(paid.body));return order.body;}
before(async()=>{assert.equal(process.env.DB_NAME,'leadnest_test');await db.migrate.latest({directory:'./migrations'});const tables=await db.raw('SHOW TABLES');await db.transaction(async k=>{await k.raw('SET FOREIGN_KEY_CHECKS=0');try{for(const row of tables[0]){const table=Object.values(row)[0];if(!table.startsWith('knex_'))await k(table).del();}}finally{await k.raw('SET FOREIGN_KEY_CHECKS=1');}});for(const p of plans)await db('plans').insert({...p,limits:JSON.stringify(p.limits)});a=await account('a@example.test','Workspace A');b=await account('b@example.test','Workspace B');});
after(async()=>db.destroy());
test('signup, verification, remember-me, login and password hashes',async()=>{const u=await db('users').where({id:a.uid}).first();assert.notEqual(u.password_hash,a.password);assert.ok(u.verified);assert.equal((await a.agent.post('/api/auth/login').send({email:a.email,password:'wrong'})).status,401);assert.equal((await a.agent.get('/api/auth/me')).status,200);});
test('CSRF and cross-origin mutation protection',async()=>{assert.equal((await a.agent.post('/api/workspace/records/leads').set('X-Workspace-ID',a.w).send({name:'Blocked'})).status,403);assert.equal((await call(a,'post','/workspace/records/leads',{name:'Blocked'}).set('Origin','https://evil.example')).status,403);});
test('CRM create, read, edit, duplicate detection and persisted stage movement',async()=>{let r=await call(a,'post','/workspace/records/leads',{name:'Ada Example',email:'ada@example.test',company:'Analytical Ltd',value_paise:120000});assert.equal(r.status,201,JSON.stringify(r.body));lead=r.body.id;assert.equal((await call(a,'post','/workspace/records/leads',{name:'Duplicate',email:'ada@example.test'})).status,409);assert.equal((await call(a,'patch','/workspace/records/leads/'+lead,{status:'Won'})).status,200);assert.equal((await db('leads').where({id:lead}).first()).status,'Won');assert.equal((await call(a,'get','/workspace/dashboard')).body.conversion,100);});
test('cross-workspace records, exports, search, dashboard and AI are isolated',async()=>{for(const method of ['get','patch'])assert.equal((await call(b,method,'/workspace/records/leads/'+lead,method==='patch'?{name:'Intrusion'}:undefined)).status,404);assert.equal((await call(b,'get','/workspace/records/leads',undefined,a.w)).status,404);assert.equal((await call(b,'get','/workspace/search?q=Ada')).body.length,0);const exp=await call(b,'get','/workspace/records/leads/export');assert.ok(!exp.text.includes('Ada Example'));assert.equal((await call(b,'post','/workspace/ai',{action:'summary',prompt:'Tell me about this lead',lead_id:lead})).status,404);});
test('Free feature gates block import, email, invoices and CRM AI',async()=>{assert.equal((await call(a,'post','/workspace/records/leads/import',{csv:'name\nNew lead',mapping:{name:'name'}})).status,403);assert.equal((await call(a,'post','/workspace/ai',{action:'summary',prompt:'Summary'})).status,403);assert.equal((await call(a,'post','/workspace/invoices',{client_name:'Customer',due_date:'2026-12-01',items:[{description:'Service',quantity:1,unit_paise:100}]})).status,403);});
test('server prices reject amount tampering; invalid webhook signatures cannot activate',async()=>{assert.equal((await call(a,'post','/workspace/billing/orders',{plan:'trial',amount:1})).status,400);assert.equal((await request(app).post('/api/payments/webhook').set('X-Razorpay-Signature','a'.repeat(64)).send({status:'captured'})).status,400);assert.equal((await entitlement(db,a.w)).plan.id,'free');});
let trialOrder;
test('verified trial, duplicate and out-of-order payment events are idempotent',async()=>{trialOrder=await buy(a);assert.equal(trialOrder.amount,100);const before=await db('subscriptions').where({workspace_id:a.w});assert.equal(before.length,1);assert.equal((await call(a,'post','/workspace/billing/sandbox/'+trialOrder.id,{status:'captured'})).status,200);assert.equal((await call(a,'post','/workspace/billing/sandbox/'+trialOrder.id,{status:'failed'})).status,200);assert.equal((await db('subscriptions').where({workspace_id:a.w})).length,1);assert.equal((await entitlement(db,a.w)).limits.ai,20);const o=await db('payment_orders').where({id:trialOrder.id}).first();await assert.rejects(processEvent({provider:'sandbox',merchant:'local-sandbox',currency:'INR',amount:1,payment_id:'x',status:'captured',order_id:o.provider_order_id},id(),'x'),/mismatch/);});
test('signed sandbox events validate event authenticity and exact merchant/order',async()=>{const o=await call(b,'post','/workspace/billing/orders',{plan:'trial'});const evt={provider:'sandbox',order_id:o.body.provider_order_id,merchant:'local-sandbox',currency:'INR',amount:100,payment_id:'test_signed',status:'captured'};const body=JSON.stringify(evt),sig=createHmac('sha256',process.env.SANDBOX_WEBHOOK_SECRET).update(body).digest('hex');for(let i=0;i<2;i++)assert.equal((await request(app).post('/api/payments/webhook').set('Content-Type','application/json').set('X-Razorpay-Signature',sig).set('X-Razorpay-Event-Id','same-event').send(body)).status,200);assert.equal((await db('subscriptions').where({workspace_id:b.w})).length,1);});
test('CSV preview, validation, duplicate skipping and safe export',async()=>{let r=await call(a,'post','/workspace/records/leads/import',{csv:'Full Name,Email\nImport One,one@example.test\nBad,not-an-email',mapping:{name:'Full Name',email:'Email'},commit:false});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.valid,1);assert.equal(r.body.errors.length,1);r=await call(a,'post','/workspace/records/leads/import',{csv:'name,email\nImport One,one@example.test\nDuplicate,one@example.test',mapping:{name:'name',email:'email'},duplicate:'skip',commit:true});assert.equal(r.status,200);assert.equal(r.body.valid,1);assert.equal(r.body.skipped,1);await call(a,'post','/workspace/records/contacts',{name:'=HYPERLINK("evil")'});const out=await call(a,'get','/workspace/records/contacts/export');assert.match(out.text,/'=HYPERLINK/);});
test('concurrent quota checks allow only the remaining record capacity',async()=>{const sub=await db('subscriptions').where({workspace_id:a.w}).first();const snapshot=typeof sub.snapshot==='string'?JSON.parse(sub.snapshot):sub.snapshot;const [{n}]=await db('leads').where({workspace_id:a.w,archived:false}).count('* as n');const old=snapshot.limits.leads;snapshot.limits.leads=Number(n)+1;await db('subscriptions').where({id:sub.id}).update({snapshot:JSON.stringify(snapshot)});const r=await Promise.all(['Race One','Race Two'].map(name=>call(a,'post','/workspace/records/leads',{name})));assert.deepEqual(r.map(x=>x.status).sort(),[201,403]);snapshot.limits.leads=old;await db('subscriptions').where({id:sub.id}).update({snapshot:JSON.stringify(snapshot)});});
test('team invitation single use, expiry, role permissions and member record scope',async()=>{member=await account('member@example.test','Member');let r=await call(a,'post','/workspace/team/invite',{email:member.email,role:'member'});assert.equal(r.status,200);const raw=sentMail.findLast(m=>m.to===member.email).text.split('invite=')[1];r=await call(member,'post','/workspace/team/accept',{token:raw});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal((await call(member,'post','/workspace/team/accept',{token:raw})).status,400);member.w=a.w;assert.equal((await call(member,'get','/workspace/records/leads/'+lead)).status,404);assert.equal((await call(member,'post','/workspace/billing/orders',{plan:'pro'})).status,403);assert.equal((await call(member,'post','/workspace/team/invite',{email:'other@example.test',role:'member'})).status,403);assert.equal((await call(member,'post','/workspace/records/leads',{name:'Forbidden assignment',assigned_to:a.uid})).status,403);r=await call(a,'post','/workspace/team/invite',{email:'expired@example.test',role:'member'});assert.equal(r.status,200);const old=sentMail.findLast(m=>m.to==='expired@example.test').text.split('invite=')[1];await db('invitations').where({token_hash:hash(old)}).update({expires_at:new Date(Date.now()-1000)});assert.equal((await call(member,'post','/workspace/team/accept',{token:old})).status,400);});
test('client invoice totals, PDF and subscription receipt separation',async()=>{const r=await call(a,'post','/workspace/invoices',{client_name:'Invoice Client',due_date:'2026-12-01',tax_bps:1800,items:[{description:'Design',quantity:2,unit_paise:15000}]});assert.equal(r.status,201,JSON.stringify(r.body));const inv=await db('crm_invoices').where({id:r.body.id}).first();assert.equal(Number(inv.total_paise),35400);const pdf=await call(a,'get','/workspace/invoices/'+inv.id+'/pdf');assert.equal(pdf.status,200);assert.match(pdf.headers['content-type'],/pdf/);assert.equal((await call(b,'get','/workspace/invoices/'+inv.id+'/pdf')).status,404);assert.ok(await db('billing_receipts').where({workspace_id:a.w}).first());});
test('AI demo labels, explainable score and independent support allowance',async()=>{const r=await call(a,'post','/workspace/ai',{action:'score',prompt:'Score this lead',lead_id:lead});assert.equal(r.status,200);assert.equal(r.body.mode,'demo');assert.match(r.body.response,/Demo rule-based score/);const support=await call(a,'post','/workspace/ai',{action:'support',prompt:'A question not documented: lunar calendar synchronization'});assert.equal(support.status,200);assert.equal(support.body.mode,'documentation');assert.equal(support.body.ticket,true);assert.ok(await db('support_tickets').where({workspace_id:a.w}).first());});
test('email templates save, but absent provider cannot falsely send',async()=>{const d=await call(a,'post','/workspace/emails',{recipient:'customer@example.test',subject:'Hello',body:'A real draft',is_template:false});assert.equal(d.status,201);const r=await call(a,'post','/workspace/emails/'+d.body.id+'/send',{confirm:true});assert.equal(r.status,503);assert.equal((await db('email_jobs').where({draft_id:d.body.id})).length,0);});
test('prepaid plan starts after current term; cancellation preserves current access',async()=>{await buy(a,'basic');const subs=await db('subscriptions').where({workspace_id:a.w}).orderBy('starts_at');assert.equal(subs.length,2);assert.equal(subs[0].ends_at,subs[1].starts_at);assert.equal((await entitlement(db,a.w)).plan.id,'trial');assert.equal((await call(a,'post','/workspace/billing/cancel',{})).status,200);assert.equal((await entitlement(db,a.w)).plan.id,'trial');assert.equal(monthEnd(new Date('2027-01-31T12:00:00Z')).toISOString(),'2027-02-28T12:00:00.000Z');});
test('trial expiry falls back to Free, preserves data and blocks paid actions',async()=>{const count=(await db('leads').where({workspace_id:b.w})).length;await db('subscriptions').where({workspace_id:b.w}).update({ends_at:new Date(Date.now()-1000)});assert.equal((await entitlement(db,b.w)).plan.id,'free');assert.equal((await db('leads').where({workspace_id:b.w})).length,count);assert.equal((await call(b,'post','/workspace/ai',{action:'summary',prompt:'Summarize'})).status,403);assert.equal((await call(b,'post','/workspace/billing/orders',{plan:'trial'})).status,400);assert.equal((await call(b,'get','/workspace/records/leads/export')).status,200);});
test('refund or dispute revokes entitlement and capture retry cannot reactivate it',async()=>{await call(a,'post','/workspace/billing/sandbox/'+trialOrder.id,{status:'disputed'});await call(a,'post','/workspace/billing/sandbox/'+trialOrder.id,{status:'captured'});assert.equal((await db('subscriptions').where({workspace_id:a.w,kind:'trial'}).first()).status,'revoked');});
test('platform owner routes reject normal users',async()=>assert.equal((await call(a,'get','/owner/overview')).status,403));
test('password reset revokes old sessions; token single use; logout persists',async()=>{const r=await b.agent.post('/api/auth/forgot').send({email:b.email});assert.equal(r.status,200);const raw=sentMail.findLast(m=>m.to===b.email).text.split('token=')[1];assert.equal((await b.agent.post('/api/auth/reset').send({token:raw,password:'Another secure password!'})).status,200);assert.equal((await b.agent.get('/api/auth/me')).status,401);assert.equal((await b.agent.post('/api/auth/reset').send({token:raw,password:'Another secure password!'})).status,400);const login=await b.agent.post('/api/auth/login').send({email:b.email,password:'Another secure password!'});b.csrf=login.body.csrf;assert.equal((await call(b,'post','/auth/logout',{})).status,200);assert.equal((await b.agent.get('/api/auth/me')).status,401);});


test('owner MFA, immutable past prices, support administration and suspension',async()=>{
const OTPAuth=await import('otpauth');const secret=new OTPAuth.Secret({size:20});await db('users').where({id:a.uid}).update({platform_owner:true,totp_secret:secret.base32});
assert.equal((await call(a,'get','/owner/overview')).status,428);
assert.equal((await call(a,'post','/auth/mfa',{code:'not-a-code'})).status,403);
const code=new OTPAuth.TOTP({secret,period:30,digits:6}).generate();assert.equal((await call(a,'post','/auth/mfa',{code})).status,200);
assert.equal((await call(a,'get','/owner/overview')).status,200);
const old=await db('plans').where({id:'basic'}).first();const snapshot=await db('subscriptions').where({workspace_id:a.w,kind:'paid'}).first();
assert.equal((await call(a,'patch','/owner/plans/basic',{price_paise:55900,limits:typeof old.limits==='string'?JSON.parse(old.limits):old.limits})).status,200);
assert.deepEqual((await db('subscriptions').where({id:snapshot.id}).first()).snapshot,snapshot.snapshot);
assert.equal((await call(a,'post','/owner/accounts/'+b.uid,{suspended:true,reason:'Automated test suspension',confirm:true})).status,200);
assert.equal((await b.agent.post('/api/auth/login').send({email:b.email,password:'Another secure password!'})).status,401);
assert.equal((await call(a,'post','/owner/accounts/'+b.uid,{suspended:false,reason:'Automated test restoration',confirm:true})).status,200);
const t=await db('support_tickets').where({workspace_id:a.w}).first();assert.equal((await call(a,'patch','/owner/support/'+t.id,{status:'Resolved',reply:'Reviewed in automated test'})).status,200);
const ov=await call(a,'get','/owner/overview');assert.equal(ov.body.revenue,0);assert.ok(ov.body.audit.length>=4);});
test('AI allowance boundary is atomic and new subscription periods reset counters',async()=>{
const active=await db('subscriptions').where({workspace_id:a.w,kind:'paid'}).first();await db('subscriptions').where({id:active.id}).update({starts_at:new Date(Date.now()-60000)});
const e=await entitlement(db,a.w);await db('usage_counters').insert({workspace_id:a.w,period:e.period,metric:'ai',used:e.limits.ai-1}).onConflict(['workspace_id','period','metric']).merge({used:e.limits.ai-1});
const requests=await Promise.all([1,2].map(()=>call(a,'post','/workspace/ai',{action:'summary',prompt:'Summarize the authorized leads'})));assert.deepEqual(requests.map(r=>r.status).sort(),[200,403]);
assert.equal((await db('usage_counters').where({workspace_id:a.w,period:e.period,metric:'ai'}).first()).used,e.limits.ai);
assert.equal((await call(a,'post','/workspace/ai',{action:'support',prompt:'How can I cancel?'})).status,200);
});
test('due task and lead follow-up jobs are scoped and idempotent',async()=>{
const task=await call(a,'post','/workspace/records/tasks',{name:'Due test task',due_at:new Date(Date.now()-60000).toISOString()});assert.equal(task.status,201);
const l=await call(a,'post','/workspace/records/leads',{name:'Due follow-up test',follow_up_at:new Date(Date.now()-60000).toISOString()});assert.equal(l.status,201);
const {tick}=await import('../server/worker.js');await tick();await tick();
const taskNotices=await db('notifications').where({workspace_id:a.w,user_id:a.uid,title:'Task due: Due test task'});const leadNotices=await db('notifications').where({workspace_id:a.w,user_id:a.uid,title:'Follow-up due: Due follow-up test'});assert.equal(taskNotices.length,1);assert.equal(leadNotices.length,1);
assert.equal((await db('notifications').where({workspace_id:b.w,title:'Task due: Due test task'})).length,0);
});

test('Razorpay Standard Checkout: minimum amount, provider errors, signatures and capture verification',async()=>{
const {gateway}=await import('../server/razorpay.js');const original={...gateway};const saved={provider:process.env.PAYMENT_PROVIDER,key:process.env.RAZORPAY_KEY_ID,secret:process.env.RAZORPAY_KEY_SECRET,account:process.env.RAZORPAY_ACCOUNT_ID};process.env.PAYMENT_PROVIDER='razorpay';process.env.RAZORPAY_KEY_ID='rzp_test_unit_only';process.env.RAZORPAY_KEY_SECRET='unit-only-signing-secret';delete process.env.RAZORPAY_ACCOUNT_ID;
const plan=await db('plans').where({id:'business'}).first();
try{
gateway.createOrder=async()=>{throw {statusCode:401};};
assert.equal((await call(a,'post','/workspace/billing/orders',{plan:'business'})).status,401);
gateway.createOrder=async()=>{throw {statusCode:503};};
assert.equal((await call(a,'post','/workspace/billing/orders',{plan:'business'})).status,500);
await db('plans').where({id:'business'}).update({price_paise:99});
assert.equal((await call(a,'post','/workspace/billing/orders',{plan:'business'})).status,400);
await db('plans').where({id:'business'}).update({price_paise:plan.price_paise});
gateway.createOrder=async body=>{assert.equal(body.amount,199900);assert.equal(body.currency,'INR');assert.equal(body.partial_payment,false);return {id:'order_unit_verified',amount:body.amount,currency:body.currency};};
const created=await call(a,'post','/workspace/billing/orders',{plan:'business'});assert.equal(created.status,201,JSON.stringify(created.body));assert.equal(created.body.order_id,'order_unit_verified');assert.ok(!JSON.stringify(created.body).includes(process.env.RAZORPAY_KEY_SECRET));
const endpoint='/workspace/billing/verify';
assert.equal((await call(a,'post',endpoint,{})).status,400);
const details={razorpay_order_id:'order_unit_verified',razorpay_payment_id:'pay_unit_verified',razorpay_signature:'a'.repeat(64)};
assert.equal((await call(a,'post',endpoint,details)).status,400);
details.razorpay_signature=createHmac('sha256',process.env.RAZORPAY_KEY_SECRET).update(details.razorpay_order_id+'|'+details.razorpay_payment_id).digest('hex');
gateway.fetchOrder=async()=>({id:details.razorpay_order_id,currency:'INR',amount:199900,amount_paid:199900,status:'paid'});
gateway.fetchPayment=async()=>({id:details.razorpay_payment_id,order_id:details.razorpay_order_id,currency:'INR',amount:199900,status:'authorized'});
assert.equal((await call(a,'post',endpoint,details)).status,400);
gateway.fetchPayment=async()=>({id:details.razorpay_payment_id,order_id:details.razorpay_order_id,currency:'USD',amount:199900,status:'captured'});
assert.equal((await call(a,'post',endpoint,details)).status,400);
gateway.fetchPayment=async()=>({id:details.razorpay_payment_id,order_id:details.razorpay_order_id,currency:'INR',amount:199900,status:'captured'});
for(let i=0;i<2;i++){const r=await call(a,'post',endpoint,details);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.success,true);}
assert.equal((await db('payments').where({provider_payment_id:'pay_unit_verified'})).length,1);
assert.equal((await db('subscriptions').where({workspace_id:a.w,plan_id:'business'})).length,1);
}finally{Object.assign(gateway,original);process.env.PAYMENT_PROVIDER=saved.provider;process.env.RAZORPAY_KEY_ID=saved.key;process.env.RAZORPAY_KEY_SECRET=saved.secret;if(saved.account===undefined)delete process.env.RAZORPAY_ACCOUNT_ID;else process.env.RAZORPAY_ACCOUNT_ID=saved.account;await db('plans').where({id:'business'}).update({price_paise:plan.price_paise});}
});



test('email verification is required before sessions, including legacy sessions; verified browsers stay independent',async()=>{
 const email='browser-auth@example.test',password='A secure browser password!';const first=request.agent(app),second=request.agent(app);
 assert.equal((await first.post('/api/auth/signup').send({email,password,name:'Browser account',workspace:'Browser checks'})).status,201);
 const user=await db('users').where({email}).first();
 for(const browser of [first,second]){const login=await browser.post('/api/auth/login').send({email,password});assert.equal(login.status,403);assert.equal(login.body.code,'EMAIL_NOT_VERIFIED');assert.equal(login.headers['set-cookie'],undefined);assert.equal((await browser.get('/api/auth/me')).status,401);}
 assert.equal((await db('sessions').where({user_id:user.id})).length,0);
 const legacyToken='legacy-session-for-auth-test';await db('sessions').insert({hash:hash(legacyToken),user_id:user.id,csrf:'csrf-test',expires_at:new Date(Date.now()+60000)});
 assert.equal((await request(app).get('/api/auth/me').set('Cookie','ln_session='+legacyToken)).body.code,'EMAIL_NOT_VERIFIED');
 assert.equal((await request(app).get('/api/workspace/dashboard').set('Cookie','ln_session='+legacyToken)).status,403);
 const verify=sentMail.findLast(m=>m.to===email).text.split('token=')[1];assert.equal((await first.post('/api/auth/verify').send({token:verify})).status,200);
 const one=await first.post('/api/auth/login').send({email:email.toUpperCase(),password,remember:true});const two=await second.post('/api/auth/login').send({email,password});
 assert.equal(one.status,200);assert.equal(two.status,200);assert.ok(one.body.workspaces[0].id);assert.notEqual(one.body.csrf,two.body.csrf);
 assert.equal((await first.get('/api/workspace/dashboard')).status,200);assert.equal((await second.get('/api/workspace/dashboard')).status,200);
 await first.post('/api/auth/logout').set('X-CSRF-Token',one.body.csrf).send({});assert.equal((await first.get('/api/auth/me')).status,401);assert.equal((await second.get('/api/auth/me')).status,200);
});
test('local browser aliases work without allowing foreign origins',async()=>{
 const login={email:a.email,password:a.password};
 assert.equal((await request(app).post('/api/auth/login').set('Origin','http://localhost:3000').send(login)).status,200);
 assert.equal((await request(app).post('/api/auth/login').set('Origin','http://localhost:3001').send(login)).status,403);
 const prior=process.env.NODE_ENV;process.env.NODE_ENV='production';try{assert.equal((await request(app).post('/api/auth/login').set('Origin','http://localhost:3000').send(login)).status,403);}finally{process.env.NODE_ENV=prior;}
});
test('missing email setup never claims delivery or creates an unverifiable new account',async()=>{
 const prior=process.env.MAIL_MODE;process.env.MAIL_MODE='disabled';
 try{
  const config=await request(app).get('/api/config');assert.equal(config.body.email,'unconfigured');
  const signup=await request(app).post('/api/auth/signup').send({email:'no-mail@example.test',password:'A secure test password!',name:'No mail',workspace:'No mail'});
  assert.equal(signup.status,503);assert.equal(signup.body.code,'MAIL_UNAVAILABLE');assert.equal(await db('users').where({email:'no-mail@example.test'}).first(),undefined);
  for(const endpoint of ['forgot','resend-verification'])assert.equal((await request(app).post('/api/auth/'+endpoint).send({email:a.email})).status,503);
 }finally{process.env.MAIL_MODE=prior;}
});
test('SMTP rejection is honest, signup remains recoverable, and successful resend contains a usable verification link',async()=>{
 const {mailTransport,verifyMailTransport}=await import('../server/mail.js');const originalCreate=mailTransport.create;
 const settings={MAIL_MODE:'smtp',SMTP_HOST:'smtp.example.test',SMTP_PORT:'465',SMTP_USER:'sender@example.test',SMTP_PASSWORD:'test-only-password',MAIL_FROM:'LeadNest <sender@example.test>'};const saved=Object.fromEntries(Object.keys(settings).map(key=>[key,process.env[key]]));Object.assign(process.env,settings);
 const email='smtp-recovery@example.test',password='A secure SMTP password!';let delivery,closed=0;
 try{
  mailTransport.create=options=>{assert.equal(options.secure,true);assert.equal(options.auth.pass,settings.SMTP_PASSWORD);return {sendMail:async()=>({accepted:[],rejected:[email]}),verify:async()=>{throw Error('provider-secret-detail')},close:()=>closed++};};
  await assert.rejects(verifyMailTransport(),e=>e.code==='MAIL_UNAVAILABLE'&&!e.message.includes('provider-secret-detail'));
  const signup=await request(app).post('/api/auth/signup').send({email,password,name:'SMTP recovery',workspace:'SMTP recovery'});assert.equal(signup.status,201);assert.equal(signup.body.delivery,'failed');assert.match(signup.body.message,/account was created/);
  assert.equal((await request(app).post('/api/auth/login').send({email,password})).status,403);
  assert.equal((await request(app).post('/api/auth/resend-verification').send({email})).status,503);
  mailTransport.create=()=>({sendMail:async message=>{delivery=message;return {accepted:[email],rejected:[],messageId:'mock-smtp-id'};},verify:async()=>true,close:()=>closed++});
  await verifyMailTransport();const resend=await request(app).post('/api/auth/resend-verification').send({email});assert.equal(resend.status,200);assert.equal(resend.body.delivery,'live');assert.equal(delivery.to,email);assert.equal(delivery.from,settings.MAIL_FROM);
  const token=delivery.text.split('token=')[1];assert.equal((await request(app).post('/api/auth/verify').send({token})).status,200);assert.equal((await request(app).post('/api/auth/login').send({email,password})).status,200);assert.ok(closed>=4);
 }finally{mailTransport.create=originalCreate;for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
