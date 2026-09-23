import nodemailer from 'nodemailer';
import {mkdir,writeFile} from 'node:fs/promises';
import {id} from './security.js';
export const sentMail=[];
export const mailTransport={create:options=>nodemailer.createTransport(options)};
const unavailable=()=>Object.assign(Error('Email delivery is unavailable. Please contact the site owner to finish email setup, then request a new link.'),{status:503,code:'MAIL_UNAVAILABLE'});
export function mailStatus(){
 const mode=process.env.MAIL_MODE||'smtp';
 if(mode==='outbox'&&process.env.NODE_ENV!=='production')return {mode:'outbox',ready:true};
 const port=Number(process.env.SMTP_PORT||587);
 const ready=mode==='smtp'&&!!process.env.SMTP_HOST&&!!process.env.MAIL_FROM&&Number.isInteger(port)&&port>0&&port<=65535&&!!process.env.SMTP_USER===!!process.env.SMTP_PASSWORD;
 return {mode:ready?'smtp':'unconfigured',ready};
}
export const mailConfigured=()=>mailStatus().mode==='smtp';
export function assertMailAvailable(){if(!mailStatus().ready)throw unavailable();}
function transport(){
 if(!mailConfigured())throw unavailable();
 const port=Number(process.env.SMTP_PORT||587);
 return mailTransport.create({host:process.env.SMTP_HOST,port,secure:port===465,requireTLS:port!==465,connectionTimeout:15000,greetingTimeout:10000,socketTimeout:20000,auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined});
}
export async function verifyMailTransport(){const sender=transport();try{await sender.verify();return {ok:true};}catch{throw unavailable();}finally{sender.close();}}
export async function sendMail({to,subject,text,messageId}){
 assertMailAvailable();
 if(mailStatus().mode==='outbox'){
  const item={to,subject,text,messageId:messageId||id(),development:true};sentMail.push(item);
  if(process.env.NODE_ENV!=='test'){await mkdir('work/mail',{recursive:true});await writeFile('work/mail/'+id()+'.json',JSON.stringify(item,null,2));}
  return {mode:'outbox',messageId:item.messageId};
 }
 const sender=transport();
 try{const result=await sender.sendMail({from:process.env.MAIL_FROM,to,subject,text,messageId});if(!result.accepted?.length||result.rejected?.length)throw unavailable();return {mode:'live',messageId:result.messageId};}
 catch{throw unavailable();}finally{sender.close();}
}
