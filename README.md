# LeadNest
**Organize. Follow Up. Convert.**

A local CRM built with React, Vite, Express, Knex and MySQL 8. The application, API, migrations, development seed, test suite and Windows startup script are included. This is a working local development delivery; externally configured services and a production launch still require the steps below.

## Open the current installation
1. Open **http://127.0.0.1:3000** while the server is running.
2. For a demo account, read **DEVELOPMENT-ACCESS.txt** locally. Its password was randomly generated and is not hardcoded in the source.
3. Connect your email sender with **Configure-Gmail.cmd**, then run **Restart-LeadNest.cmd**. See **EMAIL-LOGIN-SETUP.md**. Email delivery is currently unavailable until you supply your Gmail address and app password locally.
4. Create an account, or use **Sign in > Resend verification email** for an existing unverified account. Open the received link, click **Verify email**, then sign in. Verified accounts can use multiple browsers at the same time.
5. To restart later, run **Start-LeadNest.ps1**, or **Start-LeadNest.cmd**. If Windows blocks local scripts, open a terminal in this folder and run `npm start` after starting the dedicated MySQL instance. See the commands below.

The existing MySQL80 Windows service on port 3306 was left unchanged. Development uses the installed MySQL binary in a separate loopback-only instance on **127.0.0.1:3307**, with the databases **leadnest** and **leadnest_test**. Its data files are at **../../work/mysql-data**, relative to this project; .local-db.json lets the startup script locate them. Application and local administrator passwords were generated randomly. The application .env is ignored by Git. The separate administrator client file is in ../../work/mysql-admin.cnf; keep it private.

**Keep the parent work/mysql-data folder when moving this installation**, or use a database backup and restore. The source ZIP deliberately excludes database files and credentials.

## New Windows setup
Prerequisites: Node.js 22.12+ (tested with Node 24), npm, and MySQL 8.

1. Extract the source into a folder you own.
2. Run `npm ci`.
3. Create a dedicated **leadnest** database and app user using **scripts/create-database.sql** in MySQL Workbench. Replace the placeholder password locally; use a dedicated account restricted to LeadNest.
4. Copy **.env.example** to **.env** and enter your DB_HOST, DB_PORT, DB_USER and DB_PASSWORD. DB_NAME must be leadnest. No unrelated database names are accepted.
5. Run `npm run migrate`, then `npm run seed` for optional, clearly labelled development sample data.
6. Run `npm run build`, then `npm start`.
7. Open **http://127.0.0.1:3000**. Keep APP_URL consistent with the exact origin you use; localhost and 127.0.0.1 are different origins.

The server listens on 127.0.0.1 by default. To use source hot reload, remove or rename dist, then run npm run dev. The Express server then mounts Vite. Normal startup serves the production frontend build. Changes to server files require a restart.

The versioned Knex migrations are authoritative. **schema.sql** is a schema-only reference snapshot, not an alternative to the migration history. Run migrations for fresh installation; do not import the snapshot and then run the initial migration.

## What is included
- Public home, features, pricing comparison, signup/login, verification, password recovery, contact, FAQ and visibly marked policy drafts.
- Supplied LeadNest logo, saved light/dark preference, responsive sidebar and keyboard-accessible modal forms.
- Account hashing with scrypt, opaque hashed session tokens, HttpOnly/SameSite cookies, CSRF protection, rate limits, session revocation and Google OAuth adapter.
- Workspace owner/admin/member roles, expiring single-use team invitations, backend authorization and workspace-scoped records, CSV, search, jobs and AI.
- Leads, contacts, companies, deals, tasks and notes: create, view/edit, archive/restore, search, status filtering, sorting and pagination.
- Lead pipeline with drag/drop and accessible stage selectors; custom pipelines on Pro/Business; Won means converted.
- Dashboard from actual records; cumulative lead history, conversion, open deals, currency-separated values, follow-ups, overdue tasks and activities. Free has the basic view; paid plans add date filtering; Pro/Business add source breakdown.
- CSV mapping, preview, row validation, duplicate handling, atomic limits, and exports protected against spreadsheet formulas.
- Client invoices with line items, taxes, currency, status and PDF; subscription receipts remain separate.
- Email drafts/templates, explicit send confirmation, queue processing, accepted/uncertain/blocked status and duplicate-send protection.
- Trial and prepaid subscriptions, immutable purchase snapshots, scheduled next periods, cancellation at term end, expiry/downgrade with data preservation.
- Platform owner area with TOTP MFA, customer/usage/payment search, future plan changes, suspension, access revocation, support management and audit history.
- Anthropic AI adapter with demo/live labels, bounded requests, quotas, limited authorized context and no autonomous write tools.
- Automated documentation-based support with a separate 100-message daily workspace allowance and ticket escalation.

The supplied static PhonePe image is kept under **reference-assets/** and is not served as a subscription checkout or used on client invoices. It cannot automatically verify payments.

## Razorpay Standard Checkout — configured in TEST mode
Your provided test credentials are saved only in the local ignored .env. The official Razorpay Node SDK is installed. No key secret is placed in React, Vite variables, HTML or the frontend bundle. The public key ID is returned by the authenticated order endpoint at runtime.

Use the existing equivalent endpoints:
- **POST /api/workspace/billing/orders** — body `{"plan":"trial"}` or basic/pro/business. Returns order_id, amount, currency, key and test mode, plus the local order reference.
- **POST /api/workspace/billing/verify** — accepts razorpay_order_id, razorpay_payment_id and razorpay_signature.
- **POST /api/payments/webhook** — raw signed provider events.

Both workspace endpoints require a signed-in verified workspace owner, session cookie, X-CSRF-Token and X-Workspace-ID. The UI supplies those automatically. No duplicate public unprotected payment endpoints were added.

Prices are loaded from the server plan catalogue; browser-supplied amounts are rejected. Every paid order must be at least **100 paise**. The ₹1 trial is exactly 100 paise. Partial payments are disabled.

Verification uses constant-time HMAC-SHA256 comparison over the stored provider order ID + "|" + payment ID. A matching browser signature alone does not activate a subscription: the backend fetches the order/payment through the account-bound SDK and also checks currency, amount, paid order state and captured payment state. Provider authentication errors return 401, other provider errors return 500, invalid/missing verification fields return 400.

The configured API key identifies the merchant for standard order/callback verification. An optional RAZORPAY_ACCOUNT_ID adds an explicit account_id check for webhooks. Payments settle according to the configured merchant account’s destination; this app does not replace it with the static PhonePe recipient.

### Test checkout
1. Start MySQL and LeadNest.
2. Verify your email, then sign in, or use the local demo account.
3. Open **Plans & billing**. The page must say **RAZORPAY TEST MODE**.
4. Click **Start paid trial** or a paid plan. The backend creates the fixed-price order and opens Razorpay’s hosted payment modal.
5. Use only payment methods and test data documented/enabled by Razorpay for your test merchant account.
6. On successful test capture, the browser sends all three Razorpay signature fields to the server, which verifies the provider state before updating access.
7. Review your period dates, payment history and receipt. Dismissing checkout leaves the order available to continue; a payment.failed event displays an error.
8. Test decline, dismiss, refresh and callback retry. No subscription should activate for failed/unverified payments.

**Verified during delivery:** the real Razorpay API accepted an authenticated backend-created INR 100-paise test order. See **RAZORPAY-SETUP-RESULT.json**. The actual Razorpay hosted test modal and contact/payment form also loaded successfully (see RAZORPAY-BROWSER-RESULT.json). A payment through that modal has not been completed; callback/capture/signature behavior was verified with isolated test doubles. No live charges were enabled.

### Required webhook setup
For eventual staging/production, configure a reachable **HTTPS** webhook URL ending in /api/payments/webhook in Razorpay’s dashboard. Subscribe to captured/failed payments, refunds and relevant dispute events. Set a dedicated webhook secret in **RAZORPAY_WEBHOOK_SECRET**, and optionally your exact merchant account ID in **RAZORPAY_ACCOUNT_ID**. Never use the API key secret as a substitute for the webhook secret.

Local callback verification works without a webhook. Reliable processing after a customer closes the page requires a configured reachable webhook. No public tunnel or deployment was created here. Validate duplicate, delayed and out-of-order events in Razorpay test mode on staging before launch.

Checkout delegates payment methods and order-bound UPI QR display to Razorpay Standard Checkout, according to merchant/device eligibility. There is no separately implemented QR Codes API flow and no static-QR automatic verification. ₹1 test-order creation succeeded, but production trial eligibility must be checked for your activated merchant before setting PRODUCTION_TRIAL_APPROVED=true.

### Other payment modes and lifecycle
PAYMENT_PROVIDER=sandbox is a **local event simulator**, not Razorpay Test Mode. It is useful for offline demonstrations and is disabled in production. PAYMENT_PROVIDER=razorpay uses the real provider API, with the key prefix identifying test/live mode.

Trial: once per workspace-owning account, 14 days from verified success, Pro feature set with the stated trial caps, no automatic debit. One prepaid future term may be scheduled. A new paid plan starts after the latest existing term; cancellation preserves purchased periods and does not issue a refund. Expiry falls back to Free and preserves records. Over-limit workspaces can export and edit existing records but cannot add excess records/seats or use paid actions.

Calendar-month rule: add one UTC calendar month and clamp the day to the last valid date, preserving the time. For example Jan 31 → Feb 28 (29 in leap years), then a subsequent term starts from that clamped date. Usage counters are keyed to the actual subscription period, not a browser date.

Full refunds and disputes revoke the affected term. Partial refunds keep the term and require provider-side review; they are not a separate ledger in this version. Dispute wins/closure are flagged for manual review and do not automatically restore paid access. Refund issuance itself is performed in the merchant dashboard, separately from cancelling access. No automatic renewal mandate is implemented.

Official references checked:
- https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
- https://razorpay.com/docs/webhooks/validate-test/
- https://razorpay.com/docs/api/payments/
- Installed official Razorpay SDK API/resources.

## Google login
Create a Google OAuth web client and configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET locally. Add **http://127.0.0.1:3000/api/auth/google/callback** as the exact authorized development redirect URI (use the deployed HTTPS origin later). Requests use state validation and server-side ID-token verification. Only verified Google emails are accepted. An existing email/password account is not silently linked by email; sign in using the original method. Explicit account-linking UI is not included.

## Email
Use **Configure-Gmail.cmd** to enter your sender address and Google app password privately. It verifies the Gmail connection before updating the ignored .env file. See **EMAIL-LOGIN-SETUP.md** for complete steps and Google account requirements. SMTP settings are MAIL_MODE=smtp, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and MAIL_FROM. TLS is required. Production startup refuses incomplete email configuration.

There is no silent local-mail fallback. Missing email configuration returns a clear error; signup is blocked before creating an account. If SMTP fails after signup commits, the account remains unverified and the response explains how to resend, without prompting duplicate signup. SMTP acceptance does not prove inbox delivery.

For intentional offline development only, set MAIL_MODE=outbox and restart. The UI explicitly says no email was sent. Local messages go to work/mail and can be read with `npm run mailbox -- your@email.example`. Production rejects outbox mode. Tests use an in-memory outbox and never send real messages.

A user must explicitly confirm outbound CRM email. An atomic quota reservation and unique draft sending job prevent repeated sends. The worker runs every 30 seconds inside the web process; `npm run worker` is also available. Use one deployment worker strategy. “Accepted” means SMTP accepted the message, not delivery to an inbox. Delivery webhooks/bounce tracking are not configured here. An interrupted/uncertain send is not retried automatically because SMTP cannot guarantee exactly-once delivery; check provider logs before intentionally creating a new draft.

Tasks and lead follow-ups generate in-app reminders; configured SMTP adds reminder emails. Invite/verification/reset messages are operational account messages, not the CRM outbound-email quota.

## AI and automated support
Set ANTHROPIC_API_KEY and a model available in your account through AI_MODEL. The configured default is claude-sonnet-4-5. Keys remain server-side. One CRM AI action accepts at most 2,000 prompt characters, retrieves at most 10 authorized limited lead records, and requests at most 600 output tokens. Server quotas are atomic; provider errors release the action reservation. Also configure a provider-level spending limit.

Without a key, requests are labelled **Demo** and use transparent templates/rule-based scoring. Demo actions count toward plan limits. Responses never send emails or mutate CRM/billing. Copy or review drafts explicitly. Support chat uses local product documentation, current catalogue prices and a separate 100-message daily fair-use allowance; it does not call a paid model. Unknown questions create tickets. It is automated support, not a promise of 24/7 human staffing.

## Bootstrap the platform owner
No owner credentials are hardcoded or seeded. Locally set OWNER_BOOTSTRAP_EMAIL and a unique OWNER_BOOTSTRAP_PASSWORD of at least 16 characters, then run `npm run bootstrap-owner`. A new dedicated owner identity is required. Bootstrap refuses if an owner already exists.

Read OWNER-MFA-SETUP.txt locally, enroll the URI in an authenticator, securely store recovery information, then remove that setup file and the bootstrap password from .env. Sign in and open /app/owner; enter a valid TOTP. Owner elevation lasts 15 minutes per session. Customer password hashes/secrets and private CRM records are not exposed in the owner area. Administrative actions require a reason and explicit confirmation.

## Tests
- `npm test`: isolated **leadnest_test** database only. It clears test fixtures; never target the development/customer database. The test suite uses mock Razorpay signatures/provider responses and never uses your real credentials for payment calls.
- `node scripts/browser-check.mjs`: local Chrome browser checks against the running development app. Uses the local demo account, adds and archives uniquely named Browser QA sample leads, and writes screenshots/results.
- `node scripts/verify-razorpay.mjs`: **explicit external test**. Requires rzp_test credentials, signs into the local demo workspace and creates or returns an existing ₹1 test order through the real gateway. Does not complete a payment.
- `node scripts/auth-browser-check.mjs`: isolated verification/login checks in Chrome and Edge using leadnest_test and an in-memory outbox.
- `npm run email:check`: test configured SMTP connection/authentication without sending any email.
- `npm run build`: production frontend build.
- `node scripts/mailbox.js [email]`: inspect recent development emails.

See TEST-RESULTS.md for the verified scope and remaining external acceptance tests.

## Deployment, operations and backups
No deployment or live charges were performed. Deploy React build + Express to an always-on Node host behind HTTPS, with a **private** MySQL connection. Do not forward or expose your laptop MySQL port to the Internet.

Set NODE_ENV=production, an HTTPS APP_URL, private DB settings, SMTP, Google redirect configuration, AI/provider settings and payment webhook secrets in the host’s secret manager. Serve the frontend from the same origin as the API. Secure cookies are enabled in production. Supply HTTPS termination at your reverse proxy; configure trusted proxy/IP rate-limit handling only for your exact infrastructure. Current in-memory rate limiting is suitable for one process; use a shared rate-limit store before running multiple web replicas.

Use separate migration and runtime database accounts on production. Restrict the runtime account to SELECT/INSERT/UPDATE/DELETE; run schema upgrades with a migration-only account. Set connection/session timezone to UTC. Apply migrations before starting the new release. Keep financial snapshots and webhook deduplication tables across deployments.

Create daily encrypted backups and test restores:
- With MySQL’s official mysqldump, use a private client option file or password prompt (never a literal password on the command line).
- Dump only **leadnest**, using --single-transaction --routines --triggers --set-gtid-purged=OFF.
- Prefer mysqldump’s --result-file=... for Windows rather than shell encoding conversions.
- Restore into a private staging leadnest database on a separate instance first. Verify migrations, user/CRM counts, invoices, subscriptions and login. Run no live mail/payment jobs while validating a restored copy.
- Keep backup retention, encryption keys and recovery access separate from the application host. Never include .env or bootstrap MFA setup in public artifacts.
- Stop the app gracefully before intentional local MySQL shutdown; use mysqladmin with the dedicated local administrator option file to shut down port 3307, not the existing 3306 service.

Before production: finish the legal/business policy drafts, verify tax/receipt obligations, complete merchant activation and ₹1 production eligibility, configure and test webhooks, validate email delivery, configure Google and AI, provision owner MFA/recovery, review TLS/backup/monitoring and run external end-to-end acceptance tests. Live payments are guarded by LIVE_PAYMENTS_ENABLED and the trial by PRODUCTION_TRIAL_APPROVED. Neither flag was enabled.

## Source layout
- client/: React screens, styles, shared controls and checkout UI
- server/: authentication, authorization, CRM, billing, Razorpay adapter, mail/AI, owner and worker
- migrations/: versioned MySQL migrations
- scripts/: setup, seed, owner bootstrap, mailbox and verification helpers
- tests/: backend integration and checkout unit tests
- public/: original logo and favicon
- reference-assets/: supplied PhonePe static QR reference
- screenshots/: captured local UI checks
- .env.example: placeholders only; .env is private local configuration

#   F U T U R E _ F S _ 0 2  
 