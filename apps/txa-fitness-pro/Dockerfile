FROM node:20-alpine3.18
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache openssl1.1-compat
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
