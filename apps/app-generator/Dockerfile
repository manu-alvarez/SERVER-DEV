# ETAPA 1: Construcción (Builder)
FROM node:22-alpine AS builder

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Variables de entorno en tiempo de build (para Gemini API)
ARG VITE_GEMINI_API_KEY
ARG VITE_GEMINI_API_KEY_2
ARG VITE_GEMINI_API_KEY_3
ARG VITE_GEMINI_API_KEY_4
ARG VITE_GEMINI_API_KEY_5
ARG VITE_GEMINI_API_KEY_6
ARG VITE_GEMINI_API_KEY_7
ARG VITE_GEMINI_API_KEY_8
ARG VITE_GEMINI_API_KEY_9
ARG VITE_GEMINI_API_KEY_10
ARG VITE_GEMINI_API_KEY_11
ARG VITE_GEMINI_API_KEY_12
ARG VITE_GEMINI_API_KEY_13
ARG VITE_GEMINI_API_KEY_14
ARG VITE_GEMINI_API_KEY_15
ARG VITE_GEMINI_API_KEY_16
ARG VITE_GEMINI_API_KEY_17

# Generar la compilación de producción con Vite
RUN npm run build

# ETAPA 2: Servidor de Producción (Nginx)
FROM nginx:1.27-alpine

# Copiar los assets compilados desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Opcional: Copiar configuración personalizada de nginx (para SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto por defecto de Nginx
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
