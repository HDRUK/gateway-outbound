FROM node:16

WORKDIR /var/www

COPY package*.json ./

RUN npm install

COPY . ./

# CMD ["npm", "run", "build:start"]
CMD ["npm", "run", "dev"]