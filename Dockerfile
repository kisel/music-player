ARG BUILDPLATFORM

FROM --platform=${BUILDPLATFORM:-linux/amd64} node:16 as builder_node
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i --production

FROM builder_node as builder_webpack
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i
COPY src ./src
COPY assets ./assets
COPY ./webpack* tsconfig.json ./
RUN npm run build
CMD npm run server

FROM node:16-slim
WORKDIR /app
COPY --from=builder_node /app/node_modules ./node_modules
COPY --from=builder_webpack /app/public ./public
COPY --from=builder_webpack /app/dist/app/server.js ./server.js
CMD node server.js


