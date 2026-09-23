FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY client ./client
COPY public ./public
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node server ./server
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node scripts/migrate.js scripts/bootstrap-owner.js scripts/check-production.mjs scripts/check-email.mjs ./scripts/
COPY --from=build --chown=node:node /app/dist ./dist
RUN chown node:node /app
USER node
EXPOSE 3000
CMD ["node", "server/index.js"]
