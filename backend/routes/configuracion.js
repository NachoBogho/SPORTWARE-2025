const express = require('express');
const router = express.Router();
const Configuracion = require('../models/Configuracion');

// Obtener la configuración global
router.get('/', async (req, res) => {
  try {
    // Buscar la configuración existente o crear una por defecto si no existe
    let configuracion = await Configuracion.findOne();
    
    if (!configuracion) {
      configuracion = new Configuracion();
      await configuracion.save();
    }
    
    res.json(configuracion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener la configuración', error: error.message });
  }
});

// Actualizar la configuración global
router.put('/', async (req, res) => {
  try {
    // Buscar la configuración existente o crear una por defecto si no existe
    let configuracion = await Configuracion.findOne();
    
    if (!configuracion) {
      configuracion = new Configuracion();
    }
    
    // Actualizar los campos con los valores proporcionados
    Object.keys(req.body).forEach(key => {
      if (key in configuracion.schema.paths) {
        configuracion[key] = req.body[key];
      }
    });
    
    configuracion.updatedAt = Date.now();
    await configuracion.save();
    
    res.json(configuracion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar la configuración', error: error.message });
  }
});

// Restablecer la configuración a valores predeterminados
router.post('/reset', async (req, res) => {
  try {
    // Eliminar la configuración existente
    await Configuracion.deleteMany({});
    
    // Crear una nueva configuración con valores predeterminados
    const nuevaConfiguracion = new Configuracion();
    await nuevaConfiguracion.save();
    
    res.json({
      mensaje: 'Configuración restablecida a valores predeterminados',
      configuracion: nuevaConfiguracion
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al restablecer la configuración', error: error.message });
  }
});

module.exports = router;