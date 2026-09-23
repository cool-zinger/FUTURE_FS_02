import {randomBytes,createHash,scryptSync,timingSafeEqual,randomUUID} from 'node:crypto';
import * as OTPAuth from 'otpauth';
import {db} from './db.js';
export const id=()=>randomUUID();
export const token=()=>randomBytes(32).toString('hex');
export const hash=s=>createHash('sha256').update(s).digest('hex');
export function passwordHash(p){const salt=token();return salt+':'+scryptSync(p,salt,64).toString('hex');}
export function checkPassword(p,h){if(!h){scryptSync(p,'dummy-login-salt',64);return false;}const [salt,key]=h.split(':');const actual=scryptSync(p,salt,64);return key.length===128&&timingSafeEqual(actual,Buffer.from(key,'hex'));}
export function fail(message,status=400,code){throw Object.assign(Error(message),{status,...(code?{code}:{})});}
export const safeUser=u=>({id:u.id,name:u.name,email:u.email,verified:!!u.verified,platform_owner:!!u.platform_owner});
export function totpValid(secret,code){try{return new OTPAuth.TOTP({issuer:'LeadNest',algorithm:'SHA1',digits:6,period:30,secret:OTPAuth.Secret.fromBase32(secret)}).validate({token:String(code),window:1})!==null;}catch{return false;}}
export async function auth(req,res,next){try{const s=await db('sessions').where({hash:hash(req.cookies.ln_session||'')}).where('expires_at','>',new Date()).first();if(!s)fail('Your session has ended. Please sign in again.',401,'AUTH_REQUIRED');const u=await db('users').where({id:s.user_id}).first();if(!u)fail('Please sign in again.',401,'AUTH_REQUIRED');if(u.suspended)fail('Account suspended. Contact support.',403);if(!u.verified)fail('Verify your email before signing in.',403,'EMAIL_NOT_VERIFIED');req.user=u;req.session=s;if(!['GET','HEAD'].includes(req.method)&&req.get('x-csrf-token')!==s.csrf)fail('Refresh this page and try again',403);next();}catch(e){next(e);}}
export async function workspace(req,res,next){try{const requested=req.get('x-workspace-id');const q=db('memberships').where({user_id:req.user.id});if(requested)q.where({workspace_id:requested});const m=await q.first();if(!m)fail('Workspace not found',404);const owner=await db('workspaces').join('users','users.id','workspaces.owner_id').where('workspaces.id',m.workspace_id).select('users.suspended').first();if(owner.suspended)fail('Workspace suspended',403);if(!req.user.verified)fail('Verify your email to access your workspace',403);req.w=m.workspace_id;req.role=m.role;next();}catch(e){next(e);}}
export function manage(req){if(!['owner','admin'].includes(req.role))fail('Admin access required',403);}
export function owner(req){if(req.role!=='owner')fail('Only the workspace owner can manage billing and settings',403);}
export function visible(q,req,field='assigned_to'){q.where('workspace_id',req.w);if(req.role==='member')q.where(field,req.user.id);return q;}
export async function audit(k,req,action,target,reason=null){await k('audit_logs').insert({id:id(),workspace_id:req.w||null,actor_id:req.user?.id||null,action,target,reason});}
export async function session(k,res,user,remember=false){const raw=token(),csrf=token();await k('sessions').insert({hash:hash(raw),user_id:user,csrf,expires_at:new Date(Date.now()+(remember?30:1)*86400000)});res.cookie('ln_session',raw,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',...(remember?{maxAge:30*86400000}:{})});return csrf;}

