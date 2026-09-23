import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productionIssues, assertProductionReady} from '../server/production.js';

const valid = () => ({NODE_ENV:'production', APP_URL:'https://crm.example.com',
  PAYMENT_PROVIDER:'razorpay', RAZORPAY_KEY_ID:'rzp_live_fixture', RAZORPAY_KEY_SECRET:'fixture-api-secret',
  RAZORPAY_WEBHOOK_SECRET:'fixture-webhook-secret', LIVE_PAYMENTS_ENABLED:'true',
  MAIL_MODE:'smtp', SMTP_HOST:'smtp.example.com', MAIL_FROM:'crm@example.com',
  DB_NAME:'leadnest', DB_HOST:'private-db', DB_USER:'leadnest_app', DB_PASSWORD:'fixture-db-secret'});

test('complete live configuration passes without requiring the optional paid trial', () => {
  assert.deepEqual(productionIssues(valid()), []);
  assert.doesNotThrow(() => assertProductionReady(valid()));
});
test('production rejects test keys, simulator, disabled live payments and missing webhook', () => {
  for (const change of [{RAZORPAY_KEY_ID:'rzp_test_fixture'}, {PAYMENT_PROVIDER:'sandbox'},
    {LIVE_PAYMENTS_ENABLED:'false'}, {RAZORPAY_WEBHOOK_SECRET:''},
    {RAZORPAY_WEBHOOK_SECRET:'fixture-api-secret'}]) {
    assert.throws(() => assertProductionReady({...valid(), ...change}), /Production configuration incomplete/);
  }
});
test('public origin, email and database checks reject unusable production settings', () => {
  for (const change of [{APP_URL:'http://crm.example.com'}, {APP_URL:'https://localhost'},
    {APP_URL:'https://crm.example.com/'}, {APP_URL:'https://user:pass@crm.example.com'},
    {MAIL_MODE:'outbox'}, {SMTP_USER:'user'}, {SMTP_PORT:'invalid'}, {DB_NAME:'leadnest_test'}]) {
    assert.ok(productionIssues({...valid(), ...change}).length);
  }
});
test('failure messages never include secret values', () => {
  const env = {...valid(), SMTP_USER:'private-sender', SMTP_PASSWORD:'',
    RAZORPAY_WEBHOOK_SECRET:'fixture-api-secret'};
  const report = productionIssues(env).join('\n');
  for (const secret of ['fixture-api-secret','fixture-db-secret','private-sender']) assert.ok(!report.includes(secret));
});
