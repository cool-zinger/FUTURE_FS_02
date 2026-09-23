import 'dotenv/config';
import request from 'supertest';
import {readFile,writeFile} from 'node:fs/promises';
import {app,errorHandler} from '../server/app.js';
import {db} from '../server/db.js';
if(!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_'))throw Error('Probe requires test credentials');
app.use(errorHandler);
try{
const text=await readFile('DEVELOPMENT-ACCESS.txt','utf8');const password=text.match(/Password: (.+)/)[1].trim();
const a=request.agent(app);const login=await a.post('/api/auth/login').send({email:'demo@leadnest.local',password});if(login.status!==200)throw Error('Development login failed');
const me=await a.get('/api/auth/me');const result=await a.post('/api/workspace/billing/orders').set('X-CSRF-Token',login.body.csrf).set('X-Workspace-ID',me.body.workspaces[0].id).send({plan:'trial'});
const report={checked_at:new Date().toISOString(),status:result.status,provider:'razorpay',test:true,...(result.status===201?{order_id:result.body.order_id,amount:result.body.amount,currency:result.body.currency,verified:'Order created through the authenticated backend; payment not yet made.'}:{error:result.body.error})};await writeFile('RAZORPAY-SETUP-RESULT.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(result.status!==201)process.exitCode=1;
}finally{await db.destroy();}

