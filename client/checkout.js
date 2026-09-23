let checkoutScript;
export function loadCheckout(){
if(window.Razorpay)return Promise.resolve();
if(checkoutScript)return checkoutScript;
checkoutScript=new Promise((resolve,reject)=>{
const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;
const timeout=setTimeout(()=>{checkoutScript=null;reject(Error('Checkout took too long to load. Please retry.'));},15000);
script.onload=()=>{clearTimeout(timeout);if(window.Razorpay)resolve();else{checkoutScript=null;reject(Error('Checkout is unavailable. Please retry.'));}};
script.onerror=()=>{clearTimeout(timeout);checkoutScript=null;script.remove();reject(Error('Could not load Razorpay checkout. Check your connection.'));};
document.body.appendChild(script);
});return checkoutScript;
}
export async function openCheckout(order,{api,notify,onVerified}){
await loadCheckout();let verified=false;
const checkout=new window.Razorpay({key:order.key,order_id:order.order_id||order.provider_order_id,amount:order.amount,currency:order.currency,name:'LeadNest',description:order.test?'LeadNest subscription · TEST PAYMENT':'LeadNest subscription',theme:{color:'#078a76'},
handler:async response=>{try{const result=await api('/workspace/billing/verify','POST',{razorpay_order_id:response.razorpay_order_id,razorpay_payment_id:response.razorpay_payment_id,razorpay_signature:response.razorpay_signature});if(!result.success)throw Error('Payment has not been verified');verified=true;notify(order.test?'Test payment verified. Your plan is ready.':'Payment verified. Your plan is ready.');onVerified();}catch(e){notify(e.message+' Your plan activates only after server verification.');}},
modal:{ondismiss:()=>{if(!verified)notify('Checkout closed. You can continue this order from Billing. Pending payments still require verification.');}},
});
checkout.on('payment.failed',response=>{notify(response.error?.description?'Payment failed: '+response.error.description:'Payment failed. Please try another provider-enabled method.');});
checkout.open();return checkout;
}

