const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Cliente = require('../models/Cliente');
const Cancha = require('../models/Cancha');
const Reserva = require('../models/Reserva');
const Configuracion = require('../models/Configuracion');

// Datos de ejemplo
const clientesEjemplo = [
  {
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@email.com',
    telefono: '11-1234-5678',
    direccion: 'Av. Corrientes 1234',
    ciudad: 'Buenos Aires',
    codigoPostal: '1000',
    notas: 'Cliente frecuente'
  },
  {
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@email.com',
    telefono: '11-8765-4321',
    direccion: 'Rivadavia 5678',
    ciudad: 'Buenos Aires',
    codigoPostal: '1002',
    notas: 'Prefiere horarios de tarde'
  },
  {
    nombre: 'Carlos',
    apellido: 'López',
    telefono: '11-9876-5432',
    direccion: 'San Martín 910',
    ciudad: 'Buenos Aires',
    codigoPostal: '1004'
  }
];

const canchasEjemplo = [
  {
    nombre: 'Cancha Principal',
    tipo: 'Fútbol 5',
    precioHora: 3000,
    descripcion: 'Cancha principal con césped sintético de última generación',
    estado: 'disponible',
    horaApertura: '08:00',
    horaCierre: '23:00'
  },
  {
    nombre: 'Cancha Secundaria',
    tipo: 'Fútbol 5',
    precioHora: 2500,
    descripcion: 'Cancha con buen césped sintético y iluminación LED',
    estado: 'disponible',
    horaApertura: '09:00',
    horaCierre: '22:00'
  },
  {
    nombre: 'Cancha de Tenis',
    tipo: 'Tenis',
    precioHora: 2000,
    descripción: 'Cancha de tenis con superficie de polvo de ladrillo',
    estado: 'disponible',
    horaApertura: '08:00',
    horaCierre: '20:00',
    diasDisponibles: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  },
  {
    nombre: 'Cancha de Pádel',
    tipo: 'Pádel',
    precioHora: 2200,
    descripcion: 'Cancha de pádel con cristales panorámicos',
    estado: 'disponible'
  }
];

const configuracionInicial = {
  nombreNegocio: 'SportWare Club',
  colorPrimario: '#0D9F6F',
  colorFondo: '#000000',
  colorTexto: '#FFFFFF',
  moneda: '$',
  impuestos: 21,
  horaAperturaGlobal: '08:00',
  horaCierreGlobal: '23:00',
  diasOperativosGlobal: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
};

class DatabaseSeeder {
  async conectar() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sportware';
      await mongoose.connect(mongoUri);
      console.log('✅ Conectado a MongoDB para seeding');
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      process.exit(1);
    }
  }

  async limpiarBase() {
    try {
      console.log('🧹 Limpiando base de datos...');
      await Cliente.deleteMany({});
      await Cancha.deleteMany({});
      await Reserva.deleteMany({});
      await Configuracion.deleteMany({});
      console.log('✅ Base de datos limpiada');
    } catch (error) {
      console.error('❌ Error limpiando base de datos:', error);
    }
  }

  async seedClientes() {
    try {
      console.log('👥 Creando clientes de ejemplo...');
      const clientes = await Cliente.create(clientesEjemplo);
      console.log(`✅ ${clientes.length} clientes creados`);
      return clientes;
    } catch (error) {
      console.error('❌ Error creando clientes:', error);
      return [];
    }
  }

  async seedCanchas() {
    try {
      console.log('🏟️ Creando canchas de ejemplo...');
      const canchas = await Cancha.create(canchasEjemplo);
      console.log(`✅ ${canchas.length} canchas creadas`);
      return canchas;
    } catch (error) {
      console.error('❌ Error creando canchas:', error);
      return [];
    }
  }

  async seedConfiguracion() {
    try {
      console.log('⚙️ Creando configuración inicial...');
      const config = await Configuracion.create(configuracionInicial);
      console.log('✅ Configuración inicial creada');
      return config;
    } catch (error) {
      console.error('❌ Error creando configuración:', error);
      return null;
    }
  }

  async seedReservas(clientes, canchas) {
    if (clientes.length === 0 || canchas.length === 0) {
      console.log('⚠️ No se pueden crear reservas sin clientes y canchas');
      return [];
    }

    try {
      console.log('📅 Creando reservas de ejemplo...');
      
      const ahora = new Date();
      const mañana = new Date(ahora);
      mañana.setDate(ahora.getDate() + 1);

      const reservasEjemplo = [
        {
          cancha: canchas[0]._id,
          cliente: clientes[0]._id,
          fechaInicio: new Date(mañana.setHours(14, 0, 0, 0)),
          fechaFin: new Date(mañana.setHours(15, 0, 0, 0)),
          precio: canchas[0].precioHora,
          estado: 'confirmada',
          pagado: true,
          observaciones: 'Reserva para partido amistoso'
        },
        {
          cancha: canchas[1]._id,
          cliente: clientes[1]._id,
          fechaInicio: new Date(mañana.setHours(16, 0, 0, 0)),
          fechaFin: new Date(mañana.setHours(17, 0, 0, 0)),
          precio: canchas[1].precioHora,
          estado: 'pendiente',
          pagado: false
        }
      ];

      const reservas = await Reserva.create(reservasEjemplo);
      console.log(`✅ ${reservas.length} reservas creadas`);
      return reservas;
    } catch (error) {
      console.error('❌ Error creando reservas:', error);
      return [];
    }
  }

  async ejecutarSeed() {
    try {
      await this.conectar();
      
      // Opción para limpiar la base antes del seed
      const args = process.argv.slice(2);
      if (args.includes('--clean')) {
        await this.limpiarBase();
      }

      // Crear datos de ejemplo
      const clientes = await this.seedClientes();
      const canchas = await this.seedCanchas();
      await this.seedConfiguracion();
      await this.seedReservas(clientes, canchas);

      console.log('🎉 ¡Seed completado exitosamente!');
      console.log('📊 Resumen:');
      console.log(`   - Clientes: ${clientes.length}`);
      console.log(`   - Canchas: ${canchas.length}`);
      console.log(`   - Configuración: Creada`);
      
    } catch (error) {
      console.error('💥 Error durante el seed:', error);
    } finally {
      await mongoose.connection.close();
      console.log('🔌 Conexión cerrada');
      process.exit(0);
    }
  }

  async verificarDatos() {
    try {
      await this.conectar();
      
      const clientesCount = await Cliente.countDocuments();
      const canchasCount = await Cancha.countDocuments();
      const reservasCount = await Reserva.countDocuments();
      const configCount = await Configuracion.countDocuments();

      console.log('📊 Estado actual de la base de datos:');
      console.log(`   - Clientes: ${clientesCount}`);
      console.log(`   - Canchas: ${canchasCount}`);
      console.log(`   - Reservas: ${reservasCount}`);
      console.log(`   - Configuraciones: ${configCount}`);

    } catch (error) {
      console.error('❌ Error verificando datos:', error);
    } finally {
      await mongoose.connection.close();
      process.exit(0);
    }
  }
}

// Ejecutar según argumentos de línea de comandos
const seeder = new DatabaseSeeder();
const command = process.argv[2];

switch (command) {
  case 'seed':
    seeder.ejecutarSeed();
    break;
  case 'check':
    seeder.verificarDatos();
    break;
  case 'clean':
    seeder.conectar().then(() => seeder.limpiarBase()).then(() => {
      console.log('🧹 Base de datos limpiada');
      mongoose.connection.close();
    });
    break;
  default:
    console.log('Uso: node scripts/seedDatabase.js [seed|check|clean]');
    console.log('  seed  - Inicializar base de datos con datos de ejemplo');
    console.log('  check - Verificar estado actual de la base de datos');
    console.log('  clean - Limpiar toda la base de datos');
    console.log('  seed --clean - Limpiar y luego inicializar');
    process.exit(1);
}

module.exports = DatabaseSeeder;
