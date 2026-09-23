import {app,errorHandler} from './app.js';
import {mailConfigured} from './mail.js';
import {assertProductionReady} from './production.js';
import {startWorker} from './worker.js';
import express from 'express';
import {existsSync} from 'node:fs';
import path from 'node:path';
if(process.env.NODE_ENV==='production'){assertProductionReady();if(!mailConfigured())throw Error('Production requires configured email delivery');if(!existsSync('dist/index.html'))throw Error('Production requires npm run build before startup');}
if(existsSync('dist/index.html')){app.use(express.static('dist'));app.get('/{*path}',(req,res)=>res.sendFile(path.resolve('dist/index.html')));}else{const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
app.use(errorHandler);
app.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('LeadNest ready at '+process.env.APP_URL));
startWorker();

