const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConfiguracionSchema = new Schema({
  nombreNegocio: {
    type: String,
    required: true,
    default: 'SportWare'
  },
  logo: {
    type: String,
    default: ''
  },
  colorPrimario: {
    type: String,
    default: '#0D9F6F' // Verde oscuro medio brillante
  },
  colorFondo: {
    type: String,
    default: '#000000' // Negro
  },
  colorTexto: {
    type: String,
    default: '#FFFFFF' // Blanco
  },
  moneda: {
    type: String,
    default: '$'
  },
  impuestos: {
    type: Number,
    default: 21 // Porcentaje de impuestos
  },
  horaAperturaGlobal: {
    type: String,
    default: '08:00'
  },
  horaCierreGlobal: {
    type: String,
    default: '22:00'
  },
  diasOperativosGlobal: {
    type: [String],
    enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
    default: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Configuración para que solo exista un documento de configuración
  collection: 'configuracion'
});

// Middleware para actualizar el campo updatedAt antes de cada actualización
ConfiguracionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Configuracion', ConfiguracionSchema);