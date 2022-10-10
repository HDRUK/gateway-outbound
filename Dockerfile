FROM node:16

WORKDIR /var/www

COPY package*.json ./

RUN npm install -g tcp-listener
RUN npm install

COPY . ./

# CMD ["npm", "run", "build:start"]
CMD ["npm", "run", "dev"]

FROM nginx:latest
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/
COPY nginx/error_pages /usr/share/nginx/html
EXPOSE 8080
CMD [ “nginx”, “-g”, “daemon off;“]