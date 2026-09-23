import 'dotenv/config';
import knex from 'knex';
if (!['leadnest','leadnest_test'].includes(process.env.DB_NAME || 'leadnest')) throw Error('Only dedicated LeadNest databases are permitted');
export const db = knex({client:'mysql2',connection:{host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'leadnest',timezone:'Z',dateStrings:true},pool:{min:0,max:10,afterCreate:(connection,done)=>connection.query("SET time_zone = '+00:00'",err=>done(err,connection))}});
export const json = x => typeof x==='string'?JSON.parse(x):x;
export const now = ()=>new Date();

