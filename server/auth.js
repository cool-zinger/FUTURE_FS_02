import {Router} from 'express';
import {rateLimit} from 'express-rate-limit';
import {OAuth2Client} from 'google-auth-library';
import {z} from 'zod';
import {db} from './db.js';
import {id,token,hash,passwordHash,checkPassword,fail,safeUser,session,auth,audit,totpValid} from './security.js';
import {createWorkspace} from './plans.js';
import {sendMail,mailStatus,assertMailAvailable} from './mail.js';
export const router=Router();
const limit=rateLimit({windowMs:15*60000,limit:process.env.NODE_ENV==='test'?500:25,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many sign-in attempts. Please wait 15 minutes and try again.',code:'RATE_LIMITED'}});
router.use((req,res,next)=>['/me','/profile','/logout','/revoke-sessions'].includes(req.path)?next():limit(req,res,next));
const email=z.string().trim().email().max(190).transform(s=>s.toLowerCase());
const pass=z.string().min(12,'Use at least 12 characters').max(128);
export async function issue(k,u,kind){const raw=token();await k('auth_tokens').insert({hash:hash(raw),user_id:u.id,kind,expires_at:new Date(Date.now()+(kind==='verify'?24:1)*3600000)});return raw;}
async function sessionPayload(user,csrf){const memberships=await db('memberships').join('workspaces','workspaces.id','memberships.workspace_id').where({user_id:user.id}).select('workspaces.id','workspaces.name','memberships.role');return {user:safeUser(user),csrf,workspaces:memberships};}
async function accountMail(user,raw,kind){return sendMail({to:user.email,subject:kind==='verify'?'Verify your LeadNest email':'Reset your LeadNest password',text:process.env.APP_URL+(kind==='verify'?'/verify':'/reset')+'?token='+raw});}
router.post('/signup',async(req,res)=>{
 const b=z.object({name:z.string().trim().min(2).max(100),email,password:pass,workspace:z.string().trim().min(2).max(100)}).parse(req.body);
 assertMailAvailable();let raw,u;
 await db.transaction(async k=>{if(await k('users').where({email:b.email}).first())fail('An account with this email already exists. Sign in or request a new verification link.',409,'ACCOUNT_EXISTS');u={id:id(),name:b.name,email:b.email,password_hash:passwordHash(b.password)};await k('users').insert(u);await createWorkspace(k,u.id,b.workspace);raw=await issue(k,u,'verify');});
 // Account creation has committed: delivery failure must not invite a duplicate signup.
 try{const delivery=await accountMail(u,raw,'verify');res.status(201).json({delivery:delivery.mode,message:delivery.mode==='outbox'?'Account created. No email was sent: local test inbox mode is enabled.':'Account created. Check your inbox and spam folder for the verification link.'});}
 catch{res.status(201).json({delivery:'failed',message:'Your account was created, but the verification email could not be sent. Please request a new link after the site owner checks email delivery.'});}
});
router.post('/login',async(req,res)=>{
 const b=z.object({email,password:z.string().max(128),remember:z.boolean().optional()}).parse(req.body);const u=await db('users').where({email:b.email}).first();
 if(!checkPassword(b.password,u?.password_hash)||u?.suspended)fail('Email or password is incorrect',401);
 if(!u.verified)fail('Verify your email before signing in. Use the link in your inbox or request a new one.',403,'EMAIL_NOT_VERIFIED');
 const csrf=await session(db,res,u.id,b.remember);res.json(await sessionPayload(u,csrf));
});
router.post('/verify',async(req,res)=>{const b=z.object({token:z.string().length(64)}).parse(req.body);await db.transaction(async k=>{const t=await k('auth_tokens').where({hash:hash(b.token),kind:'verify',used_at:null}).where('expires_at','>',new Date()).forUpdate().first();if(!t)fail('Verification link expired or already used');await k('users').where({id:t.user_id}).update({verified:true});await k('auth_tokens').where({hash:t.hash}).update({used_at:new Date()});});res.json({message:'Email verified. You can sign in.'});});
for(const [path,kind] of [['/forgot','reset'],['/resend-verification','verify']])router.post(path,async(req,res)=>{
 const b=z.object({email}).parse(req.body);assertMailAvailable();const q=db('users').where({email:b.email});if(kind==='verify')q.where({verified:false});const u=await q.first();let delivery=mailStatus().mode==='outbox'?'outbox':'live';
 if(u){const raw=await issue(db,u,kind);delivery=(await accountMail(u,raw,kind)).mode;}
 res.json({delivery,message:delivery==='outbox'?'No email was sent: local test inbox mode is enabled.':kind==='verify'?'If verification is needed, a new link has been sent. Check your inbox and spam folder.':'If this account exists, a reset link has been sent. Check your inbox and spam folder.'});
});
router.post('/reset',async(req,res)=>{const b=z.object({token:z.string().length(64),password:pass}).parse(req.body);await db.transaction(async k=>{const t=await k('auth_tokens').where({hash:hash(b.token),kind:'reset',used_at:null}).where('expires_at','>',new Date()).forUpdate().first();if(!t)fail('Reset link expired or already used');await k('users').where({id:t.user_id}).update({password_hash:passwordHash(b.password)});await k('auth_tokens').where({user_id:t.user_id,kind:'reset'}).update({used_at:new Date()});await k('sessions').where({user_id:t.user_id}).del();});res.json({message:'Password updated. Sign in again.'});});
router.get('/me',auth,async(req,res)=>res.json(await sessionPayload(req.user,req.session.csrf)));
router.post('/logout',auth,async(req,res)=>{await db('sessions').where({hash:req.session.hash}).del();res.clearCookie('ln_session',{path:'/'});res.json({ok:true});});
router.post('/revoke-sessions',auth,async(req,res)=>{await db('sessions').where({user_id:req.user.id}).del();res.clearCookie('ln_session',{path:'/'});res.json({ok:true});});
router.patch('/profile',auth,async(req,res)=>{const b=z.object({name:z.string().trim().min(2).max(100),currentPassword:z.string().max(128).optional(),newPassword:pass.optional()}).parse(req.body);const updates={name:b.name};if(b.newPassword){if(!checkPassword(b.currentPassword||'',req.user.password_hash))fail('Current password is incorrect',403);updates.password_hash=passwordHash(b.newPassword);}await db('users').where({id:req.user.id}).update(updates);if(b.newPassword)await db('sessions').where({user_id:req.user.id}).whereNot({hash:req.session.hash}).del();res.json({ok:true});});
router.post('/mfa',auth,async(req,res)=>{if(!req.user.platform_owner||!totpValid(req.user.totp_secret,req.body.code))fail('Invalid authentication code',403);await db('sessions').where({hash:req.session.hash}).update({mfa_at:new Date()});await audit(db,req,'platform.mfa','session');res.json({ok:true});});
const google=()=>new OAuth2Client(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.APP_URL+'/api/auth/google/callback');
router.get('/google',async(req,res)=>{if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET)fail('Google sign-in is awaiting owner configuration',503);const state=token();await db('auth_tokens').insert({hash:hash(state),kind:'oauth',expires_at:new Date(Date.now()+600000)});res.cookie('ln_oauth',state,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:600000});res.redirect(google().generateAuthUrl({scope:['openid','email','profile'],state,prompt:'select_account'}));});
router.get('/google/callback',async(req,res)=>{const state=String(req.query.state||'');if(state!==req.cookies.ln_oauth)fail('Invalid sign-in state',403);await db.transaction(async k=>{const t=await k('auth_tokens').where({hash:hash(state),kind:'oauth',used_at:null}).where('expires_at','>',new Date()).forUpdate().first();if(!t)fail('Sign-in expired',403);await k('auth_tokens').where({hash:t.hash}).update({used_at:new Date()});});const g=google();const {tokens}=await g.getToken(String(req.query.code));const ticket=await g.verifyIdToken({idToken:tokens.id_token,audience:process.env.GOOGLE_CLIENT_ID});const p=ticket.getPayload();if(!p.email_verified)fail('Google email must be verified');let u;await db.transaction(async k=>{const identity=await k('auth_identities').where({provider:'google',subject:p.sub}).first();if(identity)u=await k('users').where({id:identity.user_id}).first();else{if(await k('users').where({email:p.email.toLowerCase()}).first())fail('An account already uses this email. Sign in using its original method; automatic linking is disabled.',409);u={id:id(),email:p.email.toLowerCase(),name:p.name||'New member',verified:true};await k('users').insert(u);await k('auth_identities').insert({user_id:u.id,provider:'google',subject:p.sub});await createWorkspace(k,u.id,u.name+"'s workspace");}});if(u.suspended)fail('Account suspended',403);await session(db,res,u.id,true);res.clearCookie('ln_oauth');res.redirect('/app');});

