# ETAPA 1: Construcción (Builder)
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código fuente y compilar con Vite
COPY . .
RUN npm run build

# ETAPA 2: Servidor de Producción (Nginx)
FROM nginx:alpine
# Copiar la build del frontend generada en la Etapa 1 a Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
