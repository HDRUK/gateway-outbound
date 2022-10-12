FROM node:16 as build
WORKDIR /app
#ENV PATH /app/node_modules/.bin:$PATH
COPY package*.json /app/package.json
COPY .env /app/.env
RUN npm install --silent --legacy-peer-deps
COPY . /app
RUN npm run build:start
