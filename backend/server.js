const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
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
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Configuración de MongoDB
const connectDB = async () => {
  try {
    // Usar una ruta local para la base de datos MongoDB
    let dbPath;
    if (electronApp) {
      // Si estamos en la aplicación Electron, usar la ruta de usuario
      dbPath = path.join(electronApp.getPath('userData'), 'sportware-db');
    } else {
      // En modo desarrollo, usar una ruta predeterminada
      dbPath = path.join(__dirname, 'data', 'sportware-db');
    }
    
    await mongoose.connect(`mongodb://127.0.0.1:27017/sportware`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'sportware'
    });
    console.log('MongoDB conectado');

    // Drop índice de email si existe
    try {
      const coll = mongoose.connection.db.collection('clientes');
      const indexes = await coll.indexes();
      const emailIndex = indexes.find(i => i.name === 'email_1');
      if (emailIndex) {
        await coll.dropIndex('email_1');
        console.log('Índice único email_1 eliminado');
      }
    } catch (dropErr) {
      console.log('No se pudo eliminar índice email_1 (puede no existir):', dropErr.message);
    }
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

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
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Middleware de errores (debe ir después de las rutas)
app.use(errorHandler); // añadido

// Iniciar el servidor solo si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  // Conectar a MongoDB y luego iniciar el servidor
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor backend ejecutándose en el puerto ${PORT}`);
    });
  });
}

module.exports = app;