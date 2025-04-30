require('dotenv').config(); // Cargar variables de entorno
const Fastify = require('fastify'); // Importar Fastify
const path = require('path'); // Para manejar rutas de archivos

const fastify = Fastify({ logger: true }); // Inicializar Fastify con logger

// Registrar plugins de Fastify
fastify.register(require('@fastify/cors'), { // Habilitar CORS
    origin: [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost",
        "http://frontend",
        "https://80-yuorve-fttranscendence-mwntw4fq46g.ws-eu118.gitpod.io",
        "https://5173-yuorve-fttranscendence-mwntw4fq46g.ws-eu118.gitpod.io"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["Cross-Origin-Opener-Policy", "Cross-Origin-Embedder-Policy", "Cross-Origin-Resource-Policy", "Access-Control-Allow-Origin"],
});
fastify.register(require("@fastify/multipart"), { // Habilitar multipart/form-data
    attachFieldsToBody: true,
    limits: { fileSize: 5 * 1024 * 1024 }
});
fastify.register(require("@fastify/static"), {  // Servir archivos estáticos
    root: path.join(__dirname, "uploads"),
    prefix: "/uploads/",
});

// Importar y registrar las rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const gamesRoutes = require('./routes/games');
const friendsRoutes = require('./routes/friends');
const chatsRoutes = require('./routes/chats');

fastify.register(authRoutes);
fastify.register(userRoutes);
fastify.register(gamesRoutes);
fastify.register(friendsRoutes);
fastify.register(chatsRoutes);

// Importar y configurar WebSocket
//const setupWebSocket = require('./ws');

// Iniciar el servidor
fastify.listen({ port: process.env.PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Backend corriendo en ${address}`);
    //setupWebSocket(fastify.server);
});
