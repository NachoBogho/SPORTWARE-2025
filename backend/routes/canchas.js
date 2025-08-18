const express = require('express');
const router = express.Router();
const Cancha = require('../models/Cancha');

// Obtener todas las canchas
router.get('/', async (req, res) => {
  try {
    const canchas = await Cancha.find().sort({ nombre: 1 });
    res.json(canchas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener canchas', error: error.message });
  }
});

// Obtener canchas por tipo
router.get('/tipo/:tipo', async (req, res) => {
  try {
    const canchas = await Cancha.find({ tipo: req.params.tipo }).sort({ nombre: 1 });
    res.json(canchas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener canchas por tipo', error: error.message });
  }
});

// Obtener canchas disponibles
router.get('/disponibles', async (req, res) => {
  try {
    const canchas = await Cancha.find({ estado: 'disponible' }).sort({ nombre: 1 });
    res.json(canchas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener canchas disponibles', error: error.message });
  }
});

// Obtener una cancha por ID
router.get('/:id', async (req, res) => {
  try {
    const cancha = await Cancha.findById(req.params.id);
    
    if (!cancha) {
      return res.status(404).json({ mensaje: 'Cancha no encontrada' });
    }
    
    res.json(cancha);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener la cancha', error: error.message });
  }
});

// Crear una nueva cancha
router.post('/', async (req, res) => {
  try {
    const nuevaCancha = new Cancha(req.body);
    await nuevaCancha.save();
    
    res.status(201).json(nuevaCancha);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear la cancha', error: error.message });
  }
});

// Actualizar una cancha
router.put('/:id', async (req, res) => {
  try {
    const canchaActualizada = await Cancha.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!canchaActualizada) {
      return res.status(404).json({ mensaje: 'Cancha no encontrada' });
    }
    
    res.json(canchaActualizada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar la cancha', error: error.message });
  }
});

// Cambiar el estado de una cancha
router.patch('/:id/estado', async (req, res) => {
  try {
    if (!req.body.estado) {
      return res.status(400).json({ mensaje: 'Se requiere el campo estado' });
    }
    
    const cancha = await Cancha.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!cancha) {
      return res.status(404).json({ mensaje: 'Cancha no encontrada' });
    }
    
    res.json(cancha);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cambiar el estado de la cancha', error: error.message });
  }
});

// Eliminar una cancha
router.delete('/:id', async (req, res) => {
  try {
    const cancha = await Cancha.findByIdAndDelete(req.params.id);
    
    if (!cancha) {
      return res.status(404).json({ mensaje: 'Cancha no encontrada' });
    }
    
    res.json({ mensaje: 'Cancha eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar la cancha', error: error.message });
  }
});

module.exports = router;