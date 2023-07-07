FROM node:18.16.1-alpine3.18@sha256:d5b2a7869a4016b1847986ea52098fa404421e44281bb7615a9e3615e07f37fb as dev

WORKDIR /app

# copy code, install deps and build
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn run build

# prune non prod dependencies
RUN yarn install --production --frozen-lockfile && yarn cache clean

FROM node:18.16.1-alpine3.18@sha256:d5b2a7869a4016b1847986ea52098fa404421e44281bb7615a9e3615e07f37fb as prod

WORKDIR /app

# allows node to use runtime optimizations
ENV NODE_ENV production

COPY --from=dev app/node_modules ./node_modules
COPY --from=dev app/dist ./dist

ENTRYPOINT [ "node", "/app/dist/main.js" ]