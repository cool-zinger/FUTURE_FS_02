import {db} from '../server/db.js';
import {plans} from '../server/plans.js';
try {await db.migrate.latest({directory:'./migrations'});for(const p of plans)await db('plans').insert({...p,limits:JSON.stringify(p.limits)}).onConflict('id').ignore();console.log('LeadNest migrations complete.');}finally{await db.destroy();}

