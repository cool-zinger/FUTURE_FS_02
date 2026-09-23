# Razorpay Standard Checkout integration

Stack detected: **React + Vite frontend; Node.js + Express backend; MySQL with Knex**.

## Files created
- server/razorpay.js — official Node SDK adapter, merchant identity and safe API error handling.
- client/checkout.js — SDK script loading, modal launch, callback, dismissal and failure handling.
- tests/checkout.test.js — frontend checkout callback tests.
- scripts/verify-razorpay.mjs — explicit real test-order verification.
- scripts/checkout-browser-check.mjs — real hosted test-modal check, without payment.
- RAZORPAY-SETUP-RESULT.json and RAZORPAY-BROWSER-RESULT.json — verification evidence.

## Files modified
- server/payments.js — completed existing create-order and signature/capture verification endpoints.
- client/pages.jsx — connected Billing plan buttons to hosted Standard Checkout.
- package.json and package-lock.json — official razorpay dependency.
- .env — configured locally with your test key; excluded from source bundles and Git.
- .gitignore — excludes environment and local credential files.
- tests/integration.test.js — added provider, signature and capture tests.
- README.md and TEST-RESULTS.md — setup and verified scope.

No duplicate payment endpoints or new payment tables were needed. Existing workspace billing tables are reused.

## Endpoints
POST /api/workspace/billing/orders
- Body: {"plan":"trial"} (or basic, pro, business).
- Response includes order_id, amount in paise, currency and public key ID.
- Prices come from the server catalogue. Browser amount overrides are rejected.
- Minimum 100 paise; partial payment disabled.
- Requires the verified workspace owner’s session, CSRF token and workspace ID.

POST /api/workspace/billing/verify
- Body: razorpay_order_id, razorpay_payment_id, razorpay_signature.
- Uses the stored order ID for HMAC-SHA256 verification and constant-time comparison.
- Also fetches the provider order/payment, verifies exact amount/currency and captured/paid status, and activates at most once.
- Missing/invalid signatures return 400 and cannot activate access.

## Test locally
1. Run Start-LeadNest.ps1 or start MySQL, then npm start.
2. Open http://127.0.0.1:3000 and sign in.
3. Open Plans & billing. Confirm **RAZORPAY TEST MODE**.
4. Choose the ₹1 paid trial or a paid plan. The Razorpay modal opens.
5. Use Razorpay’s test payment information/methods. Complete a test payment and check the verified payment history and subscription.
6. Try dismissing the modal and a failed payment; neither should activate a plan.

A real ₹1 test order and the real checkout form were verified. A complete provider payment was not submitted. Automated signature/capture/error cases all pass.

## Manual configuration
- Your API test keys are already configured locally. The key secret never reaches the frontend. A VITE_ secret is neither needed nor permitted.
- Configure RAZORPAY_WEBHOOK_SECRET and a reachable staging HTTPS /api/payments/webhook endpoint for reliable confirmation after a customer closes the browser.
- Optionally set the exact RAZORPAY_ACCOUNT_ID for an additional webhook account check.
- Settlement is controlled by this merchant account’s configured destination.
- Keep LIVE_PAYMENTS_ENABLED=false. Complete merchant activation, production ₹1 eligibility, policies and staging acceptance before enabling any live payment.
- Review the full README for deployment and remaining Google/email/AI setup.

Official reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

