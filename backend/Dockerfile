# Usar Node.js como base
FROM node:18

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos del backend
COPY package.json package-lock.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto del backend
EXPOSE 4000

# Iniciar el servidor Fastify
CMD ["npm", "run", "dev"]
