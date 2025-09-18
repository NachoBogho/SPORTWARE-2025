const mongoose = require('mongoose');
const path = require('path');
const net = require('net');

// Configuración de MongoDB (sin opciones deprecated)
const mongoConfig = {
  maxPoolSize: 10, // Mantener hasta 10 conexiones socket
  serverSelectionTimeoutMS: 5000, // Mantener intentando enviar operaciones por 5 segundos
  socketTimeoutMS: 45000, // Cerrar sockets después de 45 segundos de inactividad
  family: 4 // Usar IPv4, skip trying IPv6
};

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  async connect() {
    try {
      // Obtener la URI de MongoDB desde las variables de entorno
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sportware';
      const dbName = process.env.MONGODB_DB_NAME || 'sportware';

      console.log(`🔄 Conectando a MongoDB: ${mongoUri}`);

      await mongoose.connect(mongoUri, {
        ...mongoConfig,
        dbName: dbName
      });

      this.isConnected = true;
      this.retryCount = 0;

      console.log('✅ MongoDB conectado exitosamente');
      console.log(`📊 Base de datos: ${dbName}`);

      // Configurar event listeners
      this.setupEventListeners();

      // Limpiar índices problemáticos si existen
      await this.cleanupIndexes();

      return true;
    } catch (error) {
      console.error('❌ Error al conectar a MongoDB:', error.message);
      return this.handleConnectionError(error);
    }
  }

  setupEventListeners() {
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Error de MongoDB:', error.message);
    });

    // Manejar el cierre graceful de la aplicación
    process.on('SIGINT', () => {
      this.disconnect();
    });

    process.on('SIGTERM', () => {
      this.disconnect();
    });
  }

  async handleConnectionError(error) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Reintentando conexión (${this.retryCount}/${this.maxRetries}) en 5 segundos...`);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      return this.connect();
    } else {
      console.error('💥 Máximo número de reintentos alcanzado. Cerrando aplicación...');
      process.exit(1);
    }
  }

  async cleanupIndexes() {
    try {
      // Limpiar índice problemático de email en clientes
      const coll = mongoose.connection.db.collection('clientes');
      const indexes = await coll.indexes();
      const emailIndex = indexes.find(i => i.name === 'email_1');
      
      if (emailIndex) {
        await coll.dropIndex('email_1');
        console.log('🧹 Índice único email_1 eliminado');
      }
    } catch (dropErr) {
      console.log('ℹ️ No se pudo eliminar índice email_1 (puede no existir)');
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('🔌 Conexión a MongoDB cerrada correctamente');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error al cerrar conexión a MongoDB:', error.message);
      process.exit(1);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  // Función auxiliar para verificar si un puerto está disponible
  static async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  // Función para encontrar un puerto disponible
  static async findAvailablePort(startPort = 3001, maxPort = 3010) {
    for (let port = startPort; port <= maxPort; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No se encontró puerto disponible entre ${startPort} y ${maxPort}`);
  }
}

// Exportar instancia y clase para poder usar métodos estáticos fuera
const databaseManager = new DatabaseManager();
module.exports = { databaseManager, DatabaseManager };
