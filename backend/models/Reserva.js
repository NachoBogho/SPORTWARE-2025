const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservaSchema = new Schema({
  cancha: {
    type: Schema.Types.ObjectId,
    ref: 'Cancha',
    required: true
  },
  cliente: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
    default: 'pendiente'
  },
  precio: {
    type: Number,
    required: true
  },
  pagado: {
    type: Boolean,
    default: false
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

// Middleware para actualizar el campo updatedAt antes de cada actualización
ReservaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Reserva', ReservaSchema);