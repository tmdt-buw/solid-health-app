FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:app

FROM nginx:1.30.7-alpine3.24@sha256:bef154735288bc38d99fac41ae63730684bcc661503673a04a0f9bc526ba8598
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html/solid-health-app

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
