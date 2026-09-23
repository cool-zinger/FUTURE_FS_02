# Verification results

## Passed
- **34 automated tests**: 27 backend/authorization/billing/email checks, 4 checkout UI callback tests and 3 frontend request/session tests. Command: npm test.
- **22 browser checks**: public home, login, MySQL-backed dashboard, create/edit/archive lead, reload persistence, CRM navigation, pipeline, team, email, invoices, billing, settings, AI/support, dark preference persistence and mobile navigation/overflow.
- **Real Razorpay test API**: an authenticated backend request created an INR **100-paise** order using the configured test merchant key. See RAZORPAY-SETUP-RESULT.json.
- **Real Razorpay Standard Checkout**: the external checkout SDK loaded the hosted test modal, contact form and provider-enabled payment options (including UPI QR in this test environment). No payment was submitted. See RAZORPAY-BROWSER-RESULT.json and screenshots/razorpay-test-checkout.png.
- Production frontend build succeeded.
- npm dependency audit after Razorpay SDK installation reported **0 vulnerabilities**.

- **9 authentication browser checks in Chrome and Edge**: blocked unverified login, verification from another browser, resend flow, independent verified sessions, localhost alias, retry after a temporary session lookup failure, single-browser logout, honest mail-configuration errors and no runtime errors. See AUTH-BROWSER-RESULTS.json.
- Gmail setup and restart PowerShell syntax checks passed. Actual Gmail connection awaits locally entered credentials.

## Automated coverage
Signup, one-use verification, remember-me cookie, invalid login, password hashing, password reset, session revocation, CSRF and origin checks; tenant isolation for records/search/export/AI; member assignments and role denials; invitation use/expiry; CRUD and pipeline persistence; Free gates; CSV mapping/row errors/duplicate skipping/formula-safe export; concurrent record limits; invoice totals and PDF isolation; AI demo labels/scoring/quotas; support escalation; reminder idempotency; trial activation/expiry; duplicate/out-of-order events; scheduled plans; cancellation; downgrade data preservation; refund/dispute access protection; owner MFA/audit/suspension; immutable past purchase prices.

Razorpay-specific tests cover:
- Minimum 100-paise amount.
- Browser price-tampering rejection.
- Provider authentication failure (401) and other errors (500).
- Missing signature fields (400), mismatched signature (400).
- Signature matches but payment not captured (no activation).
- Currency/amount/order consistency.
- Successful captured verification and duplicate retry.
- Key secret excluded from order responses.
- Checkout creation, callback fields, dismissal, payment.failed, verification failure and script-load failure.

## Current installation activation
The updated backend passed isolated Chrome/Edge tests. Windows denied permission to stop the older host process from this sandbox, even after network access was granted. Run Restart-LeadNest.cmd locally to load the new backend; the frontend remains compatible with the previous server during this transition. Configure Gmail privately before checking real inbox delivery.

## External acceptance work remaining
- A complete payment through Razorpay’s test modal, including verified capture and receipt, has **not** been performed against the provider.
- Configure a staging HTTPS webhook endpoint and secret; exercise real delayed, duplicate, refund and dispute webhooks. No public tunnel or deployment was created.
- Confirm ₹1 production payment eligibility with the activated merchant before enabling the live trial.
- Google OAuth, SMTP sending/delivery and Anthropic live requests require configuration and live-provider acceptance tests.
- Owner bootstrap is implemented; no real platform-owner password or MFA secret was created on the user’s behalf.
- Legal policies remain visibly marked editable drafts.

## Known practical limits
- Build emits a large frontend bundle warning (roughly 1 MB uncompressed, 287 KB gzipped). It builds and runs; route-level splitting would improve the initial download before deployment.
- SMTP “accepted” is not proof of inbox delivery. Ambiguous sends are not automatically retried.
- Partial-refund accounting, dispute restoration and issuing refunds require merchant-side review; cancellation and refunds remain separate.
- The test suite covers representative flows, not every browser/device or a penetration/load audit.

Run tests only against leadnest_test. The browser checks create and archive clearly named sample leads in the development demo workspace; these are not real customer records.

