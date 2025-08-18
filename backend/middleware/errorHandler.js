module.exports = (err, req, res, next) => {
  // Duplicate key (Mongo)
  if ((err.code === 11000 || err.code === 'VALIDATION_DUPLICATE') && (err.keyPattern || err.fields)) {
    const fields = Object.keys(err.keyPattern || err.fields || {});
    return res
      .status(409)
      .json({
        code: 'VALIDATION_DUPLICATE',
        fields,
        message: `Valor duplicado en ${fields.join(', ')}.`
      });
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, v.message])
      )
    });
  }

  // Fallback
  res.status(err.status || 500).json({
    code: err.code || 'SERVER_ERROR',
    message: err.message || 'Error interno'
  });
};
