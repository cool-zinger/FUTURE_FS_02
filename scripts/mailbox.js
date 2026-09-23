import 'dotenv/config';
import {readdir,readFile} from 'node:fs/promises';
if(process.env.NODE_ENV==='production')throw Error('Local mailbox is disabled in production');
try{const files=await readdir('work/mail');const messages=await Promise.all(files.map(async f=>({file:f,...JSON.parse(await readFile('work/mail/'+f,'utf8'))})));const recipient=process.argv[2];for(const m of messages.filter(m=>!recipient||m.to===recipient).slice(-20))console.log('\nTo: '+m.to+'\nSubject: '+m.subject+'\n'+m.text+'\n');}catch(e){if(e.code==='ENOENT')console.log('No local development emails yet.');else throw e;}

