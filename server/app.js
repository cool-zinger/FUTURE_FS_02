import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {z} from 'zod';
import {db,json} from './db.js';
import {mailStatus} from './mail.js';
import {auth,workspace,fail,id} from './security.js';
import {router as authRouter} from './auth.js';
import {router as crmRouter} from './crm.js';
import {router as workspaceRouter} from './workspace.js';
import {router as paymentRouter,webhook} from './payments.js';
import {router as aiRouter,knowledge} from './ai.js';
import {router as ownerRouter} from './owner.js';
function allowedOrigin(origin){
 if(origin===process.env.APP_URL)return true;
 if(process.env.NODE_ENV==='production')return false;
 try{const configured=new URL(process.env.APP_URL),incoming=new URL(origin);return ['localhost','127.0.0.1','[::1]'].includes(configured.hostname)&&['localhost','127.0.0.1','[::1]'].includes(incoming.hostname)&&incoming.protocol===configured.protocol&&incoming.port===configured.port&&incoming.origin===origin;}catch{return false;}
}
export const app=express();
// Only configure this when the app is reachable exclusively through trusted proxies.
if(process.env.TRUST_PROXY_HOPS){const hops=Number(process.env.TRUST_PROXY_HOPS);if(!Number.isInteger(hops)||hops<1||hops>10)throw Error('Invalid TRUST_PROXY_HOPS');app.set('trust proxy',hops);}
app.disable('x-powered-by');app.set('json replacer',(key,value)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)?value.replace(' ','T')+'Z':value);
app.use(helmet({contentSecurityPolicy:process.env.NODE_ENV==='production'?{directives:{defaultSrc:["'self'"],scriptSrc:["'self'",'https://checkout.razorpay.com'],frameSrc:['https://api.razorpay.com','https://checkout.razorpay.com'],connectSrc:["'self'",'https://api.razorpay.com'],imgSrc:["'self'",'data:','https:'],styleSrc:["'self'","'unsafe-inline'"]}}:false,crossOriginEmbedderPolicy:false}));
app.post('/api/payments/webhook',express.raw({type:'application/json',limit:'100kb'}),webhook);
app.use(express.json({limit:'2mb'}),cookieParser());
app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');if(!['GET','HEAD'].includes(req.method)&&req.get('origin')&&!allowedOrigin(req.get('origin')))return next(Object.assign(Error('Origin not permitted'),{status:403}));next();});
app.use('/api',rateLimit({windowMs:60000,limit:process.env.NODE_ENV==='test'?5000:300,message:{error:'Too many requests. Please try again shortly.',code:'RATE_LIMITED'},standardHeaders:'draft-8',legacyHeaders:false}));
app.get('/api/health',async(req,res)=>{await db.raw('SELECT 1');res.json({ok:true});});
app.get('/api/plans',async(req,res)=>res.json((await db('plans').orderBy('price_paise')).map(p=>({...p,limits:json(p.limits)}))));
app.get('/api/config',(req,res)=>res.json({google:!!process.env.GOOGLE_CLIENT_ID&&!!process.env.GOOGLE_CLIENT_SECRET,development:process.env.NODE_ENV!=='production',email:mailStatus().mode}));
app.get('/api/faq',(req,res)=>res.json(knowledge.map(k=>k.answer)));
app.post('/api/contact',rateLimit({windowMs:3600000,limit:5}),async(req,res)=>{const b=z.object({email:z.string().email().max(190),subject:z.string().min(3).max(150),message:z.string().min(10).max(5000)}).parse(req.body);await db('support_tickets').insert({...b,id:id()});res.status(201).json({message:'Your support request has been received.'});});
app.use('/api/auth',authRouter);
app.use('/api/owner',auth,ownerRouter);
app.use('/api/workspace',auth,workspace,crmRouter,workspaceRouter,paymentRouter,aiRouter);
app.use('/api',(req,res)=>res.status(404).json({error:'Endpoint not found'}));
export function errorHandler(err,req,res,next){if(res.headersSent)return next(err);if(err instanceof z.ZodError)return res.status(400).json({error:err.issues.map(x=>x.path.join('.')+': '+x.message).join('; ')});if(err.status)return res.status(err.status).json({error:err.message,...(err.code?{code:err.code}:{})});if(err.code==='ER_DUP_ENTRY')return res.status(409).json({error:'This record already exists'});console.error('Request failed:',err.code||err.name);res.status(500).json({error:'Something went wrong. Please try again.'});}

