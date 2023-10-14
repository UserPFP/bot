FROM node:20-alpine as base
WORKDIR /usr/src/userpfp-bot
ENV DOCKER="TRUE"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY package.json pnpm-lock.yaml ./

FROM base AS build
COPY tsconfig.json ./
RUN pnpm install
COPY src src
RUN pnpm build

FROM base
RUN apk --no-cache add curl
RUN pnpm install --prod
COPY --from=build /usr/src/userpfp-bot/dist dist

HEALTHCHECK CMD curl -f http://localhost:3621/

CMD ["pnpm", "start"]
