# LeadNest Docker deployment

## GitHub Pages website preview

The Pages workflow builds React with the repository base path and publishes `dist`. In GitHub Settings > Pages, select **GitHub Actions** as the source. The site is https://cool-zinger.github.io/FUTURE_FS_02/ . Hash-based navigation keeps preview links working after refresh. Logos use the same repository base path.

Pages hosts the public website preview only. It does not run Express, MySQL, authentication or payments. The preview clearly labels this limitation and does not collect credentials or attempt payment requests. For full CRM functionality follow the server deployment instructions below. Normal Docker builds retain server-backed routes and authentication.

This repository contains a React frontend, an Express server and a MySQL database application. GitHub Pages cannot run the server or database. The Docker setup runs one application instance, one private MySQL instance, and Caddy for HTTPS. It does not purchase hosting or activate a merchant account.

## Prepare the server

Use a Linux server with Docker Engine and the Compose plugin. Point your domain's DNS to that server and allow inbound TCP ports 80 and 443. MySQL and the application have no public port mapping. Do not expose the application port separately: the supplied proxy setting trusts the single Caddy hop.

Clone this repository. Copy `.env.production.example` to `.env.production`, restrict that file to the administrator, and complete the values privately. Use distinct randomly generated database passwords. Set DOMAIN to a hostname only, with no scheme or path. Supply the live Razorpay key pair from your activated account, SMTP settings, and a distinct webhook secret. Do not copy the laptop database or development credentials to production.

In Razorpay LIVE mode, create a webhook for `https://YOUR_DOMAIN/api/payments/webhook` with that secret. Subscribe to captured and failed payments, refund events and relevant dispute events. Ensure successful payments are captured. Keep `PRODUCTION_TRIAL_APPROVED=false` until the existing INR 1 trial is confirmed eligible for your merchant account; normal paid plans can operate independently.

## Build and launch

Run from the repository directory on the server:

```sh
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d db
docker compose --env-file .env.production run --rm app npm run migrate
docker compose --env-file .env.production run --rm app npm run production:check
docker compose --env-file .env.production run --rm app npm run email:check
docker compose --env-file .env.production up -d
docker compose --env-file .env.production ps
```

The production check validates configuration presence, not actual payment credentials or webhook delivery. Startup refuses test payment keys, incomplete live configuration or a missing frontend build. Caddy obtains the HTTPS certificate after DNS and ports are ready. Application health is available at `/api/health`.

## Finish acceptance before inviting customers

Verify signup, receipt of a verification email, login and password recovery on the public domain. Complete an owner-authorized real payment, confirm subscription access and its receipt, and verify signed webhook delivery and retries in Razorpay. Review and finish the site's existing draft business policies and contact details using your actual business information. No real payment has been completed as part of this source preparation.

For the platform owner, follow the bootstrap instructions in README.md using a dedicated identity and private environment variables. Save the generated authenticator enrollment information securely before removing the container-local setup file; do not publish it. Google login and live AI are optional and require their own configuration.

## Operations

The `mysql_data` volume persists database records. Back it up regularly and test a restore. Never run `docker compose down -v` on a production installation unless you intend to destroy its database volume. The web process runs the background worker; do not add another worker or scale replicas without addressing worker coordination and shared rate limiting.

For updates, back up the database, pull the code, rebuild, run migrations and configuration checks, then run `up -d` again. The initial MySQL application user can run migrations; a hardened installation should separate migration and runtime database accounts. Use provider monitoring, backups and server security updates before relying on the service for customers.

## Current handoff

Source and deployment files are prepared. Hosting, DNS, live credentials, signed live webhook delivery, public signup acceptance and a real captured payment remain to be completed. The laptop's private environment has not been switched from test to live.
