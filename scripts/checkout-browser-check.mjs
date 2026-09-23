import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1360,height:960}});
try{
const text=await readFile('DEVELOPMENT-ACCESS.txt','utf8');const password=text.match(/Password: (.+)/)[1].trim();
await page.goto('http://127.0.0.1:3000/login');await page.getByLabel('Email address',{exact:true}).fill('demo@leadnest.local');await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:/Welcome back, Alex/}).waitFor();
await page.goto('http://127.0.0.1:3000/app/billing');await page.getByText(/RAZORPAY TEST MODE/).waitFor();
const resume=page.getByRole('button',{name:'Continue',exact:true});if(await resume.count())await resume.first().click();else await page.getByRole('button',{name:'Start paid trial',exact:true}).click();
await page.locator('iframe.razorpay-checkout-frame').waitFor({state:'visible',timeout:30000});
await page.frameLocator('iframe.razorpay-checkout-frame').locator('input').first().waitFor({state:'visible',timeout:30000});await page.frameLocator('iframe.razorpay-checkout-frame').getByText(/Contact details|Contact Details|Enter mobile|Phone number|Mobile number/i).first().waitFor({state:'visible',timeout:15000});await page.waitForTimeout(1200);console.log((await page.frameLocator('iframe.razorpay-checkout-frame').locator('body').innerText()).slice(0,900));await mkdir('screenshots',{recursive:true});await page.screenshot({path:'screenshots/razorpay-test-checkout.png',fullPage:false});
const report={passed:true,provider:'Razorpay Standard Checkout',test:true,modal:'Provider iframe rendered from the real checkout SDK',payment_completed:false};
await writeFile('RAZORPAY-BROWSER-RESULT.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}

