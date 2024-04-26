FROM node:18 AS base

RUN yarn global add pnpm

ARG REDIS_SERVER
ARG FIREBASE_ADMIN_DATABASE
ARG BOT_TOKEN

ENV REDIS_SERVER=${REDIS_SERVER} FIREBASE_ADMIN_DATABASE=${FIREBASE_ADMIN_DATABASE} BOT_TOKEN=${BOT_TOKEN}

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS runner

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

CMD ["pnpm", "start"]
