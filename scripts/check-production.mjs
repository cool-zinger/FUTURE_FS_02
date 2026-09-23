import 'dotenv/config';
import {existsSync} from 'node:fs';
import {productionIssues} from '../server/production.js';

const issues = productionIssues();
if (!existsSync('dist/index.html')) issues.push('Build the frontend with npm run build.');
if (issues.length) {
  console.error('LeadNest is not configured for public live payments:\n- ' + issues.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('Production configuration checks passed. This does not verify merchant activation, credentials, DNS, SMTP delivery, database connectivity or webhook delivery.');
}
console.log('Before launch, verify signup/email delivery, a captured payment and subscription activation, and signed webhook delivery on the deployed site.');
