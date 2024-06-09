# syntax=docker/dockerfile:1

FROM node:lts-alpine
WORKDIR /app
COPY ./src/* .
COPY package.json .
RUN npm i
CMD [ "npm", "start"]