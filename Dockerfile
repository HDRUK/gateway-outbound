FROM node:16-slim

WORKDIR /var/www

COPY package*.json ./

RUN npm install --production

COPY . ./

CMD ["npm", "run", "build:start"]