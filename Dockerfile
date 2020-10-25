FROM node:14-slim as builder1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i --production

FROM builder1 as builder_full
RUN npm i
COPY src ./src
COPY assets ./assets
COPY ./webpack* tsconfig.json ./
RUN npm run build
CMD npm run server


FROM builder1
COPY --from=builder_full /app/public ./public
COPY --from=builder_full /app/dist/app/server.js ./server.js
CMD node server.js

