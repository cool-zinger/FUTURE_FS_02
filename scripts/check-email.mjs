import 'dotenv/config';
import {verifyMailTransport} from '../server/mail.js';
try{await verifyMailTransport();console.log('Email connection and authentication succeeded. No email was sent. Restart LeadNest, then request a verification link from the sign-in page.');}
catch{console.error('Email connection failed. Check the sender address, app password, account permissions and internet connection. No email was sent.');process.exitCode=1;}
