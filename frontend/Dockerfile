# Usar Node.js como base
FROM node:18-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package.json y lockfile
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Instalar curl (si lo necesitas)
RUN apk add --no-cache curl

# Copiar el resto del código fuente
COPY . .

# Forzar polling en Chokidar para HMR en Docker/WSL
ENV CHOKIDAR_USEPOLLING=true
ENV CHOKIDAR_INTERVAL=100

# Exponer el puerto de Vite
EXPOSE 5173

# Arrancar Vite en modo dev, escuchando en todas las interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# # Usar Node.js como base
# FROM node:18-alpine

# # Establecer el directorio de trabajo
# WORKDIR /app

# # Copiar los archivos de package.json y package-lock.json
# COPY package*.json ./

# # Instalar las dependencias
# RUN npm install

# # Instalar curl
# RUN apk add --no-cache curl

# # Copiar el resto del código
# COPY . .

# # Exponer el puerto en el que Vite corre por defecto
# EXPOSE 5173

# # Comando para ejecutar Vite en modo desarrollo
# CMD ["npm", "run", "dev", "--", "--host"]