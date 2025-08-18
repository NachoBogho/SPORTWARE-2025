const express = require('express');
const router = express.Router();
const Reserva = require('../models/Reserva');
const Cancha = require('../models/Cancha');

// Reporte de ingresos por período
router.get('/ingresos', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: 'Se requieren fechaInicio y fechaFin' });
    }
    
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    
    const reservas = await Reserva.find({
      fechaInicio: { $gte: inicio, $lte: fin },
      estado: { $in: ['confirmada', 'completada'] }
    }).populate('cancha', 'nombre tipo');
    
    // Calcular ingresos totales
    const ingresoTotal = reservas.reduce((total, reserva) => total + reserva.precio, 0);
    
    // Calcular ingresos por tipo de cancha
    const ingresosPorTipo = {};
    reservas.forEach(reserva => {
      const tipo = reserva.cancha.tipo;
      if (!ingresosPorTipo[tipo]) {
        ingresosPorTipo[tipo] = 0;
      }
      ingresosPorTipo[tipo] += reserva.precio;
    });
    
    // Calcular ingresos por día
    const ingresosPorDia = {};
    reservas.forEach(reserva => {
      const fecha = reserva.fechaInicio.toISOString().split('T')[0];
      if (!ingresosPorDia[fecha]) {
        ingresosPorDia[fecha] = 0;
      }
      ingresosPorDia[fecha] += reserva.precio;
    });
    
    res.json({
      ingresoTotal,
      ingresosPorTipo,
      ingresosPorDia,
      cantidadReservas: reservas.length,
      reservas
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar reporte de ingresos', error: error.message });
  }
});

// Reporte de uso de canchas por período
router.get('/uso-canchas', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: 'Se requieren fechaInicio y fechaFin' });
    }
    
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    
    // Obtener todas las canchas
    const canchas = await Cancha.find();
    
    // Obtener reservas en el período
    const reservas = await Reserva.find({
      fechaInicio: { $gte: inicio, $lte: fin },
      estado: { $in: ['confirmada', 'completada'] }
    }).populate('cancha', 'nombre tipo');
    
    // Calcular uso por cancha
    const usoPorCancha = {};
    canchas.forEach(cancha => {
      usoPorCancha[cancha._id] = {
        nombre: cancha.nombre,
        tipo: cancha.tipo,
        cantidadReservas: 0,
        horasReservadas: 0,
        ingresos: 0
      };
    });
    
    reservas.forEach(reserva => {
      const canchaId = reserva.cancha._id.toString();
      if (usoPorCancha[canchaId]) {
        usoPorCancha[canchaId].cantidadReservas++;
        
        // Calcular horas reservadas
        const duracionMs = new Date(reserva.fechaFin) - new Date(reserva.fechaInicio);
        const duracionHoras = duracionMs / (1000 * 60 * 60);
        
        usoPorCancha[canchaId].horasReservadas += duracionHoras;
        usoPorCancha[canchaId].ingresos += reserva.precio;
      }
    });
    
    // Calcular uso por tipo de cancha
    const usoPorTipo = {};
    Object.values(usoPorCancha).forEach(cancha => {
      if (!usoPorTipo[cancha.tipo]) {
        usoPorTipo[cancha.tipo] = {
          cantidadReservas: 0,
          horasReservadas: 0,
          ingresos: 0
        };
      }
      
      usoPorTipo[cancha.tipo].cantidadReservas += cancha.cantidadReservas;
      usoPorTipo[cancha.tipo].horasReservadas += cancha.horasReservadas;
      usoPorTipo[cancha.tipo].ingresos += cancha.ingresos;
    });
    
    res.json({
      usoPorCancha,
      usoPorTipo,
      totalReservas: reservas.length
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar reporte de uso de canchas', error: error.message });
  }
});

// Reporte de reservas por cliente
router.get('/clientes', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: 'Se requieren fechaInicio y fechaFin' });
    }
    
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    
    const reservas = await Reserva.find({
      fechaInicio: { $gte: inicio, $lte: fin }
    })
      .populate('cliente', 'nombre apellido email')
      .populate('cancha', 'nombre tipo');
    
    // Agrupar por cliente
    const clientesMap = {};
    
    reservas.forEach(reserva => {
      const clienteId = reserva.cliente._id.toString();
      
      if (!clientesMap[clienteId]) {
        clientesMap[clienteId] = {
          cliente: {
            _id: reserva.cliente._id,
            nombre: reserva.cliente.nombre,
            apellido: reserva.cliente.apellido,
            email: reserva.cliente.email
          },
          cantidadReservas: 0,
          reservasCompletadas: 0,
          reservasCanceladas: 0,
          gastoTotal: 0,
          reservas: []
        };
      }
      
      clientesMap[clienteId].cantidadReservas++;
      
      if (reserva.estado === 'completada') {
        clientesMap[clienteId].reservasCompletadas++;
      } else if (reserva.estado === 'cancelada') {
        clientesMap[clienteId].reservasCanceladas++;
      }
      
      if (reserva.pagado) {
        clientesMap[clienteId].gastoTotal += reserva.precio;
      }
      
      clientesMap[clienteId].reservas.push({
        _id: reserva._id,
        fechaInicio: reserva.fechaInicio,
        fechaFin: reserva.fechaFin,
        cancha: reserva.cancha,
        estado: reserva.estado,
        precio: reserva.precio,
        pagado: reserva.pagado
      });
    });
    
    // Convertir a array y ordenar por cantidad de reservas
    const clientesArray = Object.values(clientesMap);
    clientesArray.sort((a, b) => b.cantidadReservas - a.cantidadReservas);
    
    res.json({
      clientes: clientesArray,
      totalClientes: clientesArray.length
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar reporte de clientes', error: error.message });
  }
});

// Estadísticas generales para el dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Obtener fecha actual y hace una semana
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    
    const inicioSemana = new Date();
    inicioSemana.setDate(hoy.getDate() - 7);
    inicioSemana.setHours(0, 0, 0, 0);
    
    // Reservas de la última semana
    const reservasSemana = await Reserva.find({
      fechaInicio: { $gte: inicioSemana, $lte: hoy }
    })
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido')
      .sort({ fechaInicio: -1 });
    
    // Calcular ingresos de la semana
    const ingresosSemana = reservasSemana.reduce((total, reserva) => {
      if (reserva.pagado) {
        return total + reserva.precio;
      }
      return total;
    }, 0);
    
    // Obtener últimas 5 reservas creadas
    const ultimasReservas = await Reserva.find()
      .populate('cancha', 'nombre tipo')
      .populate('cliente', 'nombre apellido')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Reservas por día de la semana
    const reservasPorDia = {};
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];
      reservasPorDia[fechaStr] = 0;
    }
    
    reservasSemana.forEach(reserva => {
      const fecha = reserva.fechaInicio.toISOString().split('T')[0];
      if (reservasPorDia[fecha] !== undefined) {
        reservasPorDia[fecha]++;
      }
    });
    
    // Uso de canchas en la semana
    const usoCanchasSemana = {};
    reservasSemana.forEach(reserva => {
      const tipo = reserva.cancha.tipo;
      if (!usoCanchasSemana[tipo]) {
        usoCanchasSemana[tipo] = 0;
      }
      usoCanchasSemana[tipo]++;
    });
    
    res.json({
      reservasSemana: reservasSemana.length,
      ingresosSemana,
      ultimasReservas,
      reservasPorDia,
      usoCanchasSemana
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener estadísticas del dashboard', error: error.message });
  }
});

module.exports = router;