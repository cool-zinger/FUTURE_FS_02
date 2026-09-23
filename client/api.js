import {staticHosting,hostingNotice} from './hosting.js';
export async function requestApi(path,{method='GET',body,csrf,workspace,onAuthFailure,fetcher=fetch}={}){
 if(staticHosting)throw Object.assign(Error(hostingNotice),{code:'STATIC_HOSTING'});
 let response;try{response=await fetcher('/api'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{}),...(workspace?{'X-Workspace-ID':workspace}:{})},body:body===undefined?undefined:JSON.stringify(body)});}catch{throw Error('Cannot reach LeadNest. Check your connection and try again.');}
 let data;try{data=await response.json();}catch{throw Object.assign(Error(response.status===429?'Too many requests. Please try again shortly.':'The server could not respond. Please try again.'),{status:response.status});}
 if(!response.ok){if(data.code==='AUTH_REQUIRED'||data.code==='EMAIL_NOT_VERIFIED')onAuthFailure?.(data);throw Object.assign(Error(data.error||'Request failed'),{status:response.status,code:data.code});}
 return data;
}
