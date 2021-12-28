ARG BUILDPLATFORM

FROM --platform=${BUILDPLATFORM:-linux/amd64} node:16 as static_builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i
COPY src ./src
COPY assets ./assets
COPY ./webpack* tsconfig.json ./
RUN npm run build
CMD npm run server

FROM node:alpine as node_modules_builder
RUN apk add gcc make python2 musl-dev g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i --production

FROM node:16-alpine
WORKDIR /app
COPY --from=node_modules_builder /app/node_modules ./node_modules
COPY --from=static_builder /app/public ./public
COPY --from=static_builder /app/dist/app/server.js ./server.js
CMD node server.js


