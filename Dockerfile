FROM node:alpine as common
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i --production

FROM common as builder_full
RUN npm i
COPY src ./src
COPY assets ./assets
COPY ./webpack* tsconfig.json ./
RUN npm run build

FROM common
COPY --from=builder_full /app/public ./public
COPY --from=builder_full /app/dist/app/server.js ./server.js
CMD node server.js

