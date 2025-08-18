const express = require('express');
const router = express.Router();
const Reserva = require('../models/Reserva');
const Cancha = require('../models/Cancha');
const mongoose = require('mongoose');

// Helpers añadidos
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function toDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Devuelve filtro de solapamiento (cualquier intersección)
function overlapFilter(canchaId, inicio, fin, extra = {}) {
  return {
    cancha: canchaId,
    estado: { $ne: 'cancelada' },
    fechaInicio: { $lt: fin },
    fechaFin: { $gt: inicio },
    ...extra
  };
}

// Obtener todas las reservas
router.get('/', async (req, res) => {
  try {
    const reservas = await Reserva.find()
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido email')
      .sort({ fechaInicio: -1 });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reservas', error: error.message });
  }
});

// Obtener reservas por fecha
router.get('/fecha/:fecha', async (req, res) => {
  try {
    const raw = req.params.fecha
    // Validar formato básico YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return res.status(400).json({ mensaje: 'Formato de fecha inválido. Use YYYY-MM-DD' })
    }
    const [y, m, d] = raw.split('-').map(Number)
    // Construir en hora local (evita parse UTC de new Date('YYYY-MM-DD'))
    const fechaInicio = new Date(y, m - 1, d, 0, 0, 0, 0)
    const fechaFin = new Date(y, m - 1, d, 23, 59, 59, 999)

    const reservas = await Reserva.find({
      fechaInicio: { $gte: fechaInicio, $lte: fechaFin }
    })
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido email')
      .sort({ fechaInicio: 1 })

    const clientesActivos = new Set(
      reservas
        .filter(r => r.estado !== 'cancelada' && r.cliente && r.cliente._id)
        .map(r => r.cliente._id.toString())
    ).size

    res.json({ reservas, clientesActivos })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reservas por fecha', error: error.message })
  }
});

// Obtener reservas por cancha
router.get('/cancha/:canchaId', async (req, res) => {
  try {
    const reservas = await Reserva.find({ cancha: req.params.canchaId })
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido email')
      .sort({ fechaInicio: -1 });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reservas por cancha', error: error.message });
  }
});

// Obtener reservas por cliente
router.get('/cliente/:clienteId', async (req, res) => {
  try {
    const reservas = await Reserva.find({ cliente: req.params.clienteId })
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido email')
      .sort({ fechaInicio: -1 });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reservas por cliente', error: error.message });
  }
});

// Endpoint para verificar disponibilidad (opcional para front)
router.get('/disponibilidad', async (req, res) => {
  try {
    const { cancha, fechaInicio, fechaFin, excluir } = req.query;

    if (!cancha || !fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: 'Parámetros requeridos: cancha, fechaInicio, fechaFin' });
    }

    if (!isValidObjectId(cancha)) {
      return res.status(400).json({ mensaje: 'ID de cancha inválido' });
    }

    const inicio = toDate(fechaInicio);
    const fin = toDate(fechaFin);

    if (!inicio || !fin) {
      return res.status(400).json({ mensaje: 'Fechas inválidas' });
    }
    if (fin <= inicio) {
      return res.status(400).json({ mensaje: 'fechaFin debe ser mayor a fechaInicio' });
    }

    const filtro = overlapFilter(cancha, inicio, fin, excluir ? { _id: { $ne: excluir } } : {});
    const conflicto = await Reserva.findOne(filtro).populate('cancha', 'nombre tipo');

    return res.json({
      disponible: !conflicto,
      conflicto
    });
  } catch (error) {
    console.error('[GET /reservas/disponibilidad] Error:', error);
    res.status(500).json({ mensaje: 'Error al verificar disponibilidad', error: error.message });
  }
});

// Obtener una reserva por ID
router.get('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de reserva inválido' });
    }
    const reserva = await Reserva.findById(req.params.id)
      .populate('cancha')
      .populate('cliente');
    
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
    
    res.json(reserva);
  } catch (error) {
    console.error('[GET /reservas/:id] Error:', error);
    res.status(500).json({ mensaje: 'Error al obtener la reserva', error: error.message });
  }
});

// Crear una nueva reserva
router.post('/', async (req, res) => {
  try {
    const {
      cancha,
      cliente,
      fechaInicio,
      fechaFin,
      // ... otros campos opcionales
    } = req.body;

    // Validaciones básicas
    if (!cancha || !cliente || !fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: 'Campos requeridos: cancha, cliente, fechaInicio, fechaFin' });
    }

    if (!isValidObjectId(cancha) || !isValidObjectId(cliente)) {
      return res.status(400).json({ mensaje: 'ID de cancha o cliente inválido' });
    }

    const inicio = toDate(fechaInicio);
    const fin = toDate(fechaFin);

    if (!inicio || !fin) {
      return res.status(400).json({ mensaje: 'Fechas inválidas' });
    }
    if (fin <= inicio) {
      return res.status(400).json({ mensaje: 'fechaFin debe ser mayor a fechaInicio' });
    }

    // Verificar existencia de la cancha (evita 500 si el ID no existe)
    const canchaExiste = await Cancha.exists({ _id: cancha });
    if (!canchaExiste) {
      return res.status(404).json({ mensaje: 'La cancha no existe' });
    }

    // Solapamiento (cualquier intersección)
    const conflicto = await Reserva.findOne(overlapFilter(cancha, inicio, fin));
    if (conflicto) {
      return res.status(400).json({
        mensaje: 'La cancha no está disponible en ese horario',
        reservasConflicto: [conflicto]
      });
    }

    const nuevaReserva = new Reserva({
      ...req.body,
      fechaInicio: inicio,
      fechaFin: fin
    });

    await nuevaReserva.save();

    const reservaCompleta = await Reserva.findById(nuevaReserva._id)
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido email');

    res.status(201).json(reservaCompleta);
  } catch (error) {
    console.error('[POST /reservas] Error al crear reserva:', error);
    // Diferenciar errores de validación de otros
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Error de validación', errores: error.errors });
    }
    res.status(500).json({ mensaje: 'Error al crear la reserva', error: error.message });
  }
});

// Actualizar una reserva
router.put('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de reserva inválido' });
    }

    const reservaActual = await Reserva.findById(req.params.id);
    if (!reservaActual) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }

    let fechaInicio = req.body.fechaInicio ? toDate(req.body.fechaInicio) : reservaActual.fechaInicio;
    let fechaFin = req.body.fechaFin ? toDate(req.body.fechaFin) : reservaActual.fechaFin;
    const cancha = req.body.cancha || reservaActual.cancha;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: 'Fechas inválidas' });
    }
    if (fechaFin <= fechaInicio) {
      return res.status(400).json({ mensaje: 'fechaFin debe ser mayor a fechaInicio' });
    }

    if (req.body.cancha && !isValidObjectId(req.body.cancha)) {
      return res.status(400).json({ mensaje: 'ID de cancha inválido' });
    }

    // Verificar solapamiento excluyendo la propia
    const conflicto = await Reserva.findOne(
      overlapFilter(cancha, fechaInicio, fechaFin, { _id: { $ne: reservaActual._id } })
    );

    if (conflicto) {
      return res.status(400).json({
        mensaje: 'La cancha no está disponible en ese horario',
        reservasConflicto: [conflicto]
      });
    }

    const reservaActualizada = await Reserva.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        fechaInicio,
        fechaFin,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    )
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido email');

    res.json(reservaActualizada);
  } catch (error) {
    console.error('[PUT /reservas/:id] Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Error de validación', errores: error.errors });
    }
    res.status(500).json({ mensaje: 'Error al actualizar la reserva', error: error.message });
  }
});

// Cancelar una reserva
router.patch('/:id/cancelar', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de reserva inválido' });
    }
    const reserva = await Reserva.findByIdAndUpdate(
      req.params.id,
      { estado: 'cancelada', updatedAt: Date.now() },
      { new: true }
    )
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido email');
    
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
    
    res.json(reserva);
  } catch (error) {
    console.error('[PATCH /reservas/:id/cancelar] Error:', error);
    res.status(500).json({ mensaje: 'Error al cancelar la reserva', error: error.message });
  }
});

// Marcar una reserva como pagada
router.patch('/:id/pagar', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de reserva inválido' });
    }
    const reserva = await Reserva.findByIdAndUpdate(
      req.params.id,
      { pagado: true, updatedAt: Date.now() },
      { new: true }
    )
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido email');
    
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
    
    res.json(reserva);
  } catch (error) {
    console.error('[PATCH /reservas/:id/pagar] Error:', error);
    res.status(500).json({ mensaje: 'Error al marcar la reserva como pagada', error: error.message });
  }
});

// Eliminar una reserva
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de reserva inválido' });
    }
    const reserva = await Reserva.findByIdAndDelete(req.params.id);
    
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }
    
    res.json({ mensaje: 'Reserva eliminada correctamente' });
  } catch (error) {
    console.error('[DELETE /reservas/:id] Error:', error);
    res.status(500).json({ mensaje: 'Error al eliminar la reserva', error: error.message });
  }
});

module.exports = router;