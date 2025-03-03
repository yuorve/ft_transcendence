# Usar Node.js como base
FROM node:18

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos del frontend
COPY package.json package-lock.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar el frontend con Vite
RUN npm run build

# Usar nginx para servir el frontend
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html

# Exponer el puerto 80 para servir el frontend
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
