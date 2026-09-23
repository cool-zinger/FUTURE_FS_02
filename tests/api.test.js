import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestApi} from '../client/api.js';
const response=(status,data)=>async()=>({ok:status<400,status,json:async()=>data});
test('network, server and rate limit failures do not log out an existing session',async()=>{
 let logout=0;const onAuthFailure=()=>logout++;
 for(const fetcher of [async()=>{throw Error('offline')},response(503,{error:'Unavailable'}),response(429,{error:'Too many requests'}),async()=>({status:502,ok:false,json:async()=>{throw Error('not JSON')}})])await assert.rejects(requestApi('/auth/me',{fetcher,onAuthFailure}));
 assert.equal(logout,0);
});
test('expired and unverified sessions are cleared; gateway authentication failures preserve login',async()=>{
 let logout=0;const onAuthFailure=()=>logout++;
 for(const [status,code] of [[401,'AUTH_REQUIRED'],[403,'EMAIL_NOT_VERIFIED']])await assert.rejects(requestApi('/auth/me',{fetcher:response(status,{error:'Sign in again',code}),onAuthFailure}),e=>e.code===code);
 assert.equal(logout,2);await assert.rejects(requestApi('/workspace/billing/orders',{fetcher:response(401,{error:'Payment gateway authentication failed'}),onAuthFailure}));assert.equal(logout,2);
});
test('requests use same-origin cookies and include session CSRF and workspace headers',async()=>{
 const value=await requestApi('/auth/profile',{method:'PATCH',body:{name:'Test'},csrf:'csrf-token',workspace:'workspace-id',fetcher:async(url,options)=>{assert.equal(url,'/api/auth/profile');assert.equal(options.credentials,'same-origin');assert.equal(options.headers['X-CSRF-Token'],'csrf-token');assert.equal(options.headers['X-Workspace-ID'],'workspace-id');assert.equal(options.body,JSON.stringify({name:'Test'}));return {ok:true,json:async()=>({ok:true})};}});assert.equal(value.ok,true);
});
