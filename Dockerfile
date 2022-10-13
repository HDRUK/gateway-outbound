FROM node:16
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
COPY .env /app/.env
RUN npm install --silent --legacy-peer-deps
COPY . /app
CMD ["npm", "run", "build:start"]
