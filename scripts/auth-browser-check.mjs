import 'dotenv/config';
import express from 'express';
import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';process.env.DB_NAME='leadnest_test';process.env.MAIL_MODE='outbox';
const {app,errorHandler}=await import('../server/app.js');const {db}=await import('../server/db.js');const {sentMail}=await import('../server/mail.js');
app.use(express.static('dist'));app.get('/{*path}',(req,res)=>res.sendFile(path.resolve('dist/index.html')));app.use(errorHandler);
const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const base='http://127.0.0.1:'+server.address().port;process.env.APP_URL=base;
const browsers=[],results=[],errors=[];
try{
 for(const channel of ['chrome','msedge'])browsers.push(await chromium.launch({channel,headless:true}));
 const chrome=await browsers[0].newContext(),edge=await browsers[1].newContext();const first=await chrome.newPage(),second=await edge.newPage();for(const page of [first,second])page.on('pageerror',e=>errors.push(e.message));
 const email='auth-browser-'+Date.now()+'@example.test',password='A secure browser flow password!';
 await first.goto(base+'/signup');await first.getByLabel('Full name',{exact:true}).fill('Verified Browser');await first.getByLabel('Workspace name',{exact:true}).fill('Browser verification');await first.getByLabel('Email address',{exact:true}).fill(email);await first.getByLabel('Password',{exact:true}).fill(password);await first.getByRole('button',{name:'Create account',exact:true}).click();await first.getByText('Account created. No email was sent: local test inbox mode is enabled.',{exact:true}).waitFor();results.push('Signup honestly identifies local email test mode');
 async function signIn(page,origin=base){await page.goto(origin+'/login');await page.getByLabel('Email address',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();}
 for(const page of [first,second]){await signIn(page);await page.getByText('Verify your email before signing in. Use the link in your inbox or request a new one.',{exact:true}).first().waitFor();assert.equal((await page.context().cookies()).some(c=>c.name==='ln_session'),false);}
 results.push('Chrome and Edge cannot create sessions before email verification');
 await first.getByRole('link',{name:'Resend verification email'}).click();await expect(first.getByLabel('Email address',{exact:true})).toHaveValue(email);await first.getByRole('button',{name:'Send verification link',exact:true}).click();await first.getByText('No email was sent: local test inbox mode is enabled.',{exact:true}).waitFor();results.push('Resend preserves the account address and reports delivery mode');
 const verification=sentMail.findLast(m=>m.to===email).text;await second.goto(verification);await second.getByRole('button',{name:'Verify email',exact:true}).click();await second.getByRole('link',{name:'Continue to sign in',exact:true}).waitFor();assert.equal(await second.getByRole('button',{name:'Verify email',exact:true}).count(),0);results.push('Verification works in another browser and cannot be resubmitted in the same form');
 await signIn(first);await first.getByRole('heading',{name:/Welcome back/}).waitFor();await signIn(second,base.replace('127.0.0.1','localhost'));await second.getByRole('heading',{name:/Welcome back/}).waitFor();await first.reload();await first.getByRole('heading',{name:/Welcome back/}).waitFor();results.push('Verified Chrome and Edge sessions work together, including localhost alias');
 await first.route('**/api/auth/me',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary connection problem'})}));await first.reload();await first.getByRole('button',{name:'Retry connection',exact:true}).waitFor();assert.equal(await first.getByRole('button',{name:'Sign in',exact:true}).count(),0);await first.unroute('**/api/auth/me');await first.getByRole('button',{name:'Retry connection',exact:true}).click();await first.getByRole('heading',{name:/Welcome back/}).waitFor();results.push('Temporary session lookup failure offers retry and preserves authentication');
 await first.getByRole('button',{name:'Sign out',exact:true}).click();await first.getByRole('button',{name:'Sign in',exact:true}).waitFor();await second.reload();await second.getByRole('heading',{name:/Welcome back/}).waitFor();results.push('Signing out of Chrome leaves Edge signed in');
 process.env.MAIL_MODE='disabled';await first.goto(base+'/forgot');await first.getByText(/Email delivery is not set up yet/).waitFor();await first.getByLabel('Email address',{exact:true}).fill(email);await first.getByRole('button',{name:'Send reset link',exact:true}).click();await first.getByText(/Email delivery is unavailable/).waitFor();assert.equal(await first.getByText(/reset link has been sent/).count(),0);assert.equal(await first.getByRole('link',{name:'Google',exact:true}).count(),0);results.push('Missing email configuration shows an actionable error without claiming delivery');
 assert.deepEqual(errors,[]);results.push('No Chrome or Edge runtime errors');
 await writeFile('AUTH-BROWSER-RESULTS.json',JSON.stringify({passed:results.length,results,errors},null,2));console.log(JSON.stringify({passed:results.length,results,errors},null,2));
}finally{for(const browser of browsers)await browser.close();await new Promise(resolve=>server.close(resolve));await db.destroy();}
