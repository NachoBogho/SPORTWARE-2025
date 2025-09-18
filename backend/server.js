const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar configuración de base de datos
const { databaseManager, DatabaseManager } = require('./config/database');

// Intentar cargar electron solo si está disponible
let electronApp;
try {
  const electron = require('electron');
  electronApp = electron.app;
} catch (error) {
  // Electron no está disponible, probablemente estamos en modo desarrollo
  console.log('Electron no está disponible, ejecutando en modo standalone');
  electronApp = null;
}

// Inicializar Express
const app = express();
let PORT = process.env.PORT || 3001;

// Configuración de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.LOG_LEVEL || 'dev'));

// Importar rutas
const reservasRoutes = require('./routes/reservas');
const clientesRoutes = require('./routes/clientes');
const canchasRoutes = require('./routes/canchas');
const reportesRoutes = require('./routes/reportes');
const configuracionRoutes = require('./routes/configuracion');
const errorHandler = require('./middleware/errorHandler'); // añadido

// Usar rutas
app.use('/api/reservas', reservasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/canchas', canchasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/configuracion', configuracionRoutes);

// Ruta para verificar que el servidor está funcionando
app.get('/api/status', (req, res) => {
  const dbStatus = databaseManager.getConnectionStatus();
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando correctamente',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Ruta para información de la base de datos
app.get('/api/db-info', (req, res) => {
  const dbStatus = databaseManager.getConnectionStatus();
  res.json(dbStatus);
});

// Middleware de errores (debe ir después de las rutas)
app.use(errorHandler);

// Función para iniciar el servidor con puerto dinámico
async function startServer() {
  try {
    // Verificar si el puerto está disponible, si no, buscar uno libre
    if (!(await DatabaseManager.isPortAvailable(PORT))) {
      console.log(`⚠️ Puerto ${PORT} ocupado, buscando puerto disponible...`);
      PORT = await DatabaseManager.findAvailablePort(PORT, PORT + 10);
      console.log(`✅ Puerto disponible encontrado: ${PORT}`);
    }

    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor backend ejecutándose en el puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    });

    // Manejar errores del servidor
    server.on('error', async (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`❌ Puerto ${PORT} ocupado, buscando alternativa...`);
        try {
          PORT = await DatabaseManager.findAvailablePort(PORT + 1, PORT + 10);
          console.log(`🔄 Reintentando con puerto ${PORT}...`);
          server.close();
          startServer();
        } catch (portError) {
          console.error('💥 No se pudo encontrar un puerto disponible:', portError.message);
          process.exit(1);
        }
      } else {
        console.error('💥 Error del servidor:', error.message);
        process.exit(1);
      }
    });

    return server;
  } catch (error) {
    console.error('💥 Error iniciando el servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar el servidor solo si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  // Conectar a MongoDB y luego iniciar el servidor
  databaseManager.connect().then((success) => {
    if (success) {
      startServer();
    }
  }).catch((error) => {
    console.error('💥 Error iniciando la aplicación:', error);
    process.exit(1);
  });
}

module.exports = app;