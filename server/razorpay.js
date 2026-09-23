import Razorpay from 'razorpay';
import {fail} from './security.js';
export function merchantIdentity(){return process.env.RAZORPAY_ACCOUNT_ID||'key:'+process.env.RAZORPAY_KEY_ID;}
function sdk(){
const key_id=process.env.RAZORPAY_KEY_ID,key_secret=process.env.RAZORPAY_KEY_SECRET;
if(!key_id||!key_secret)fail('Razorpay credentials are not configured',503);
if(!/^rzp_(test|live)_/.test(key_id))fail('Razorpay key ID is invalid',503);
if(process.env.NODE_ENV==='production'&&!key_id.startsWith('rzp_live_'))fail('Production requires Razorpay live credentials',503);
if(key_id.startsWith('rzp_live_')&&process.env.LIVE_PAYMENTS_ENABLED!=='true')fail('Live payments are disabled',403);
return new Razorpay({key_id,key_secret});
}
export const gateway={
createOrder:body=>sdk().orders.create(body),
fetchOrder:id=>sdk().orders.fetch(id),
fetchPayment:id=>sdk().payments.fetch(id)
};
export async function providerRequest(path,method='GET',body){
try{
if(path==='orders'&&method==='POST')return await gateway.createOrder(body);
if(path.startsWith('orders/')&&method==='GET')return await gateway.fetchOrder(decodeURIComponent(path.slice(7)));
if(path.startsWith('payments/')&&method==='GET')return await gateway.fetchPayment(decodeURIComponent(path.slice(9)));
fail('Unsupported provider operation',400);
}catch(e){if(e.status)throw e;const status=Number(e.statusCode||e.status||500);if(status===401)fail('Razorpay authentication failed. Check the server credentials.',401);fail('Razorpay could not complete the request. Please try again.',500);}
}

