# Usar una imagen base de Alpine
FROM alpine

# Instalar SQLite
RUN apk add --no-cache sqlite

# Crear directorio para la base de datos
WORKDIR /database

# Copiar la base de datos inicial (si existe)
COPY data.db /database/data.db

# Exponer el volumen para persistencia
VOLUME ["/database"]

CMD ["sh", "-c", "sqlite3 /database/data.db & tail -f /dev/null"]
