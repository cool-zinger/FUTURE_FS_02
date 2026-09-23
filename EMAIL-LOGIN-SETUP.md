# Email and sign-in setup

## Current status
The sign-in fixes are installed. Accounts must verify email before receiving a session; verified accounts can remain signed in across multiple browsers. Gmail sending still needs your sender address and Google app password. No real verification email has been sent or confirmed during these checks.

## Connect Gmail privately
1. Enable 2-Step Verification on the Google account you want to send from.
2. Create an app password at https://myaccount.google.com/apppasswords. Use an app password, not your normal account password. Google Workspace administrators may restrict this option; if it is unavailable, ask your administrator about an approved SMTP relay or OAuth configuration.
3. Double-click **Configure-Gmail.cmd** in this folder. Enter your sender address and the app password when prompted. Password input is hidden. The helper checks the SMTP connection without sending a message, and saves the settings only after a successful check. It keeps the credentials in the existing ignored **.env** file and preserves your database/payment settings.
4. Double-click **Restart-LeadNest.cmd** to stop the previous Node server on the configured port and start the updated app. Keep its window open. The current Codex sandbox could not stop the old background process, so this local restart is required to activate all backend fixes. The shortcut refuses to stop a program that is not a Node server running server/index.js.
5. Open http://127.0.0.1:3000/login and select **Resend verification email**. Enter the email address of your existing account. Do not create the same account again.
6. Open the email link and click **Verify email**, then sign in. Check both the inbox and spam folder. You can open the link in another browser on the same computer.
7. Sign in separately in Chrome, Edge or another browser with the same verified account. Signing out of one browser leaves the others signed in. Password reset and “revoke all sessions” still end every session.

The current APP_URL points to this computer. Email links cannot open this local server from a phone or another computer. A shared deployment needs a reachable HTTPS APP_URL. Google sign-in is a separate integration and remains hidden until its OAuth credentials are configured.

## Check configuration
Run **npm run email:check** from this folder to check connection/authentication without sending mail. A successful SMTP response is not proof that a particular message reached an inbox; complete steps 5–6 to confirm that.

Normal settings used by the Gmail helper:
- MAIL_MODE=smtp
- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=465 (TLS)
- SMTP_USER=your sender address
- SMTP_PASSWORD=your app password, entered locally
- MAIL_FROM=LeadNest <your sender address>

No verification link or password is exposed through the public configuration API. Offline local outbox mode must be deliberately enabled and is clearly labelled. It is disabled in production.

## Changes and tests
Modified: server/auth.js, server/security.js, server/mail.js, server/app.js, server/index.js; client/main.jsx, client/public.jsx; package.json; .env and .env.example; tests/integration.test.js; README.md and TEST-RESULTS.md.

Added: Restart-LeadNest.cmd, Restart-LeadNest.ps1, client/api.js, tests/api.test.js, Configure-Gmail.cmd, Configure-Gmail.ps1, scripts/check-email.mjs, scripts/auth-browser-check.mjs, AUTH-BROWSER-RESULTS.json and this guide.

34 automated tests passed. Nine browser acceptance checks passed in Chrome and Edge: unverified access refusal, cross-browser verification, independent verified sessions, resend recovery, localhost compatibility and recovery from a temporary session lookup error. SMTP acceptance/rejection was simulated; Gmail credentials and actual inbox delivery remain a manual setup step.

Google references: https://support.google.com/accounts/answer/185833 and https://support.google.com/a/answer/176600
SMTP transport reference: https://nodemailer.com/smtp
