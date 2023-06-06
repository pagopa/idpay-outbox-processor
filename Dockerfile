FROM node:16-alpine as dev

RUN apk update

WORKDIR /app

# copy code, install deps and build
COPY ./*.json ./
COPY yarn.lock ./yarn.lock
COPY src/ ./
RUN yarn install
RUN npm run build

# prune non prod deps
RUN yarn install --production

FROM node:16-alpine as prod

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dev app/node_modules ./node_modules
COPY --from=dev app/dist ./dist

ENTRYPOINT [ "node", "/app/dist/main.js" ]