const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClienteSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true // eliminado unique/sparse: ahora es un campo opcional común
  },
  telefono: {
    type: String,
    trim: true,
    // unique handled via index below (kept here non-breaking)
  },
  direccion: {
    type: String,
    trim: true
  },
  ciudad: {
    type: String,
    trim: true
  },
  codigoPostal: {
    type: String,
    trim: true
  },
  notas: {
    type: String,
    trim: true
  },
  observaciones: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices de unicidad (sparse permite valores null/undefined/ausentes)
ClienteSchema.index({ telefono: 1 }, { unique: true, sparse: true }); // conserva unicidad de teléfono
// (Índice de email eliminado)

// Normalizar campos opcionales para que null / '' no se indexen como valores duplicados
ClienteSchema.pre(['validate','save'], function(next) {
  if (!this.email) this.email = undefined;          // evita email: null
  if (!this.telefono) this.telefono = undefined;    // evita telefono: null
  next();
});

// Middleware para actualizar el campo updatedAt antes de cada actualización
ClienteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware para capturar errores de clave duplicada y normalizarlos
ClienteSchema.post(['save','findOneAndUpdate','updateOne','insertMany'], function(error, doc, next) {
  if (error && (error.code === 11000 || error.name === 'MongoServerError')) {
    const fields = Object.keys(error.keyPattern || {});
    error.status = 409;
    error.code = 'VALIDATION_DUPLICATE';
    error.fields = fields;
    error.message = `Valor duplicado en ${fields.join(', ')}.`;
  }
  next(error);
});

// Método virtual para obtener el nombre completo
ClienteSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

module.exports = mongoose.model('Cliente', ClienteSchema);