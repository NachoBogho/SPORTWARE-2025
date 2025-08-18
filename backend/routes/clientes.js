const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const mongoose = require('mongoose'); // añadido

// Helpers añadidos
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeString(v) {
  return typeof v === 'string' ? v.trim() : v;
}

function normalizeEmail(v) {
  return typeof v === 'string' ? v.trim().toLowerCase() : v;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Obtener todos los clientes (con búsqueda opcional ?termino= o ?q=)
router.get('/', async (req, res) => {
  try {
    const terminoRaw = req.query.termino || req.query.q;
    let query = {};
    if (terminoRaw) {
      const termino = terminoRaw.toString().trim();
      if (termino) {
        const regex = new RegExp(termino, 'i');
        query = {
          $or: [
            { nombre: regex },
            { apellido: regex },
            { email: regex }
          ]
        };
      }
    }
    const clientes = await Cliente.find(query).sort({ nombre: 1, apellido: 1 });
    res.json(clientes);
  } catch (error) {
    console.error('[GET /clientes] Error:', error);
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: error.message });
  }
});

// Buscar clientes por nombre o apellido (mantener pero alinear orden)
router.get('/buscar', async (req, res) => {
  try {
    const terminoRaw = req.query.termino;
    if (!terminoRaw) {
      return res.status(400).json({ mensaje: 'Se requiere un término de búsqueda' });
    }
    const termino = terminoRaw.toString().trim();
    if (!termino) {
      return res.status(400).json({ mensaje: 'El término de búsqueda no puede estar vacío' });
    }
    const regex = new RegExp(termino, 'i');
    const clientes = await Cliente.find({
      $or: [
        { nombre: regex },
        { apellido: regex },
        { email: regex }
      ]
    }).sort({ nombre: 1, apellido: 1 }); // orden unificado
    res.json(clientes);
  } catch (error) {
    console.error('[GET /clientes/buscar] Error:', error);
    res.status(500).json({ mensaje: 'Error al buscar clientes', error: error.message });
  }
});

// Obtener un cliente por ID
router.get('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('[GET /clientes/:id] Error:', error);
    res.status(500).json({ mensaje: 'Error al obtener el cliente', error: error.message });
  }
});

// Crear un nuevo cliente
router.post('/', async (req, res) => {
  try {
    // Sanitizar email nulo / vacío para que no quede como null
    if (req.body.email == null || req.body.email === '') {
      delete req.body.email;
    }

    const nombre = normalizeString(req.body.nombre);
    const apellido = normalizeString(req.body.apellido);
    const telefono = normalizeString(req.body.telefono);
    const rawEmail = req.body.email ? normalizeEmail(req.body.email) : undefined;

    if (!nombre || !apellido || !telefono) {
      return res.status(400).json({ mensaje: 'Campos requeridos: nombre, apellido y telefono' });
    }

    let email;
    if (rawEmail) {
      if (!isValidEmail(rawEmail)) {
        return res.status(400).json({ mensaje: 'Formato de email inválido' });
      }
      email = rawEmail; // ya no comprobamos duplicado
    }

    const payload = {
      nombre,
      apellido,
      telefono,
      // Propiedades opcionales copiadas solo si vienen
      ...(email && { email }),
      ...(req.body.direccion && { direccion: req.body.direccion }),
      ...(req.body.ciudad && { ciudad: req.body.ciudad }),
      ...(req.body.codigoPostal && { codigoPostal: req.body.codigoPostal }),
      ...(req.body.notas && { notas: req.body.notas })
    }

    const nuevoCliente = new Cliente(payload);
    await nuevoCliente.save();
    return res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error('[POST /clientes] Error:', error);
    if (error.code === 11000 || error.code === 'VALIDATION_DUPLICATE') {
      const fields = Object.keys(error.keyPattern || error.fields || {});
      return res.status(409).json({
        code: 'VALIDATION_DUPLICATE',
        fields,
        message: `Valor duplicado en ${fields.join(', ')}.`
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Error de validación', errores: error.errors });
    }
    return res.status(500).json({ mensaje: 'Error al crear el cliente', error: error.message });
  }
});

async function aplicarActualizacionCliente(id, body) {
  const currentDoc = await Cliente.findById(id);
  if (!currentDoc) {
    return { error: { status: 404, mensaje: 'Cliente no encontrado' } };
  }

  const update = { ...body };
  const unset = {};

  if ('nombre' in update) update.nombre = normalizeString(update.nombre);
  if ('apellido' in update) update.apellido = normalizeString(update.apellido);
  if ('telefono' in update) update.telefono = normalizeString(update.telefono);

  if ('email' in update) {
    if (!update.email) {
      unset.email = 1;
      delete update.email;
    } else {
      const normalized = normalizeEmail(update.email);
      if (!isValidEmail(normalized)) {
        return { error: { status: 400, mensaje: 'Formato de email inválido' } };
      }
      update.email = normalized; // sin verificación de duplicado
    }
  }

  update.updatedAt = Date.now();
  const finalUpdate = Object.keys(unset).length ? { ...update, $unset: unset } : update;

  try {
    const doc = await Cliente.findByIdAndUpdate(id, finalUpdate, { new: true, runValidators: true });
    if (!doc) {
      return { error: { status: 404, mensaje: 'Cliente no encontrado' } };
    }
    return { doc };
  } catch (err) {
    if (err?.code === 11000) {
      return { error: { status: 409, mensaje: 'Valor duplicado' } };
    }
    if (err.name === 'ValidationError') {
      return { error: { status: 400, mensaje: 'Error de validación', errores: err.errors } };
    }
    throw err;
  }
}

// Actualizar un cliente (PUT)
router.put('/:id', async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ mensaje: 'ID inválido' })
  }
  try {
    const { error: updError, doc } = await aplicarActualizacionCliente(req.params.id, req.body)
    if (updError) {
      return res.status(updError.status || 400).json(updError)
    }
    return res.json(doc)
  } catch (err) {
    console.error('[PUT /clientes/:id] Error:', err)
    if (err?.code === 11000) {
      return res.status(400).json({ mensaje: 'Ya existe un cliente con ese email' })
    }
    return res.status(500).json({ mensaje: 'Error al actualizar cliente', error: err.message })
  }
})

module.exports = router;
