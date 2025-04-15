# Usar Node.js como base
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Instalar curl
RUN apk add --no-cache curl

# Copiar el resto del código
COPY . .

# Exponer el puerto en el que Vite corre por defecto
EXPOSE 5173

# Comando para ejecutar Vite en modo desarrollo
CMD ["npm", "run", "dev", "--", "--host"]