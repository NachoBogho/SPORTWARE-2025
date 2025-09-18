const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CanchaSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['Fútbol 5', 'Fútbol 7', 'Fútbol 11', 'Tenis', 'Pádel', 'Básquet', 'Vóley', 'Hockey', 'Otro'],
    default: 'Fútbol 5'
  },
  precioHora: {
    type: Number,
    required: true,
    min: 0
  },
  descripcion: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['disponible', 'mantenimiento', 'inactiva'],
    default: 'disponible'
  },
  horaApertura: {
    type: String,
    default: '08:00'
  },
  horaCierre: {
    type: String,
    default: '22:00'
  },
  diasDisponibles: {
    type: [String],
    enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sábado', 'domingo'],
    default: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sábado', 'domingo']
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

// Middleware para actualizar el campo updatedAt antes de cada actualización
CanchaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cancha', CanchaSchema);