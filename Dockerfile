FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Replit's package proxy is private to its build environment.
RUN sed -i 's#http://package-firewall.replit.internal/npm/#https://registry.npmjs.org/#g' package-lock.json
RUN npm install --global npm@11.20.0
ENV NODE_ENV=development
RUN npm ci --include=dev && test -x node_modules/.bin/tsx

COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN sed -i 's#http://package-firewall.replit.internal/npm/#https://registry.npmjs.org/#g' package-lock.json \
  && npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
