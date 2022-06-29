FROM node:16

WORKDIR /var/www

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3005

CMD ["npm", "run", "build:start"]