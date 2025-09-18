import React from 'react'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfigStore } from '../stores/configStore'

interface Cancha {
  _id: string
  nombre: string
  tipo: string
  precioHora: number
  horaApertura: string
  horaCierre: string
  diasDisponibles: string[]
  descripcion: string
  estado: 'disponible' | 'mantenimiento' | 'inactiva'
  createdAt: string
  updatedAt: string
}

interface Reserva {
  _id: string
  cliente: {
    _id: string
    nombre: string
    apellido: string
  }
  fecha: string
  horaInicio: string
  horaFin: string
  estado: 'confirmada' | 'pendiente' | 'cancelada'
  pagado: boolean
}

interface CanchaStats {
  totalReservas: number
  reservasActivas: number
  ingresoTotal: number
  proximaReserva: string | null
}

const DetalleCancha = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { config } = useConfigStore()
  const [cancha, setCancha] = useState<Cancha | null>(null)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [stats, setStats] = useState<CanchaStats>({
    totalReservas: 0,
    reservasActivas: 0,
    ingresoTotal: 0,
    proximaReserva: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [vistaReservas, setVistaReservas] = useState<'proximas' | 'todas'>('proximas')

  useEffect(() => {
    const fetchCanchaYReservas = async () => {
      try {
        // Obtener datos de la cancha
        const canchaResponse = await axios.get(`/api/canchas/${id}`)
        setCancha(canchaResponse.data)
        
        // Obtener reservas de la cancha
        const reservasResponse = await axios.get(`/api/reservas`, {
          params: { cancha: id }
        })
        setReservas(reservasResponse.data)
        
        // Calcular estadísticas
        const totalReservas = reservasResponse.data.length
        const reservasActivas = reservasResponse.data.filter(
          (r: Reserva) => r.estado !== 'cancelada' && new Date(r.fecha) >= new Date()
        ).length
        
        // Calcular ingreso total (esto debería venir del backend idealmente)
        const ingresoTotal = reservasResponse.data
          .filter((r: Reserva) => r.pagado && r.estado !== 'cancelada')
          .length * canchaResponse.data.precioHora // Esto es una aproximación
        
        // Encontrar la próxima reserva
        let proximaReserva = null
        const hoy = new Date()
        const reservasFuturas = reservasResponse.data.filter(
          (r: Reserva) => r.estado !== 'cancelada' && new Date(r.fecha) >= hoy
        )
        
        if (reservasFuturas.length > 0) {
          const reservasOrdenadas = [...reservasFuturas].sort(
            (a: Reserva, b: Reserva) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          )
          proximaReserva = reservasOrdenadas[0].fecha
        }
        
        setStats({
          totalReservas,
          reservasActivas,
          ingresoTotal,
          proximaReserva
        })
      } catch (err) {
        console.error('Error al cargar cancha:', err)
        setError('No se pudo cargar la información de la cancha. Por favor, intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCanchaYReservas()
    }
  }, [id])

  const handleCambiarEstado = async (nuevoEstado: 'disponible' | 'mantenimiento' | 'inactiva') => {
    if (!cancha) return
    
    setActionLoading(true)
    
    try {
      await axios.put(`/api/canchas/${cancha._id}/estado`, { estado: nuevoEstado })
      toast.success(`Estado cambiado a ${nuevoEstado}`)
      // Actualizar el estado local
      setCancha(prev => prev ? { ...prev, estado: nuevoEstado } : null)
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast.error('Error al cambiar el estado. Por favor, intenta de nuevo.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEliminar = async () => {
    if (!cancha) return
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la cancha ${cancha.nombre}? Esta acción no se puede deshacer.`)) {
      return
    }
    
    setActionLoading(true)
    
    try {
      // Verificar si la cancha tiene reservas activas
      const reservasActivas = reservas.filter(r => r.estado !== 'cancelada' && new Date(r.fecha) >= new Date())
      if (reservasActivas.length > 0) {
        if (!window.confirm(`Esta cancha tiene ${reservasActivas.length} reserva(s) activa(s). ¿Estás seguro de que deseas eliminarla?`)) {
          setActionLoading(false)
          return
        }
      }
      
      await axios.delete(`/api/canchas/${cancha._id}`)
      toast.success('Cancha eliminada exitosamente')
      navigate('/canchas')
    } catch (error) {
      console.error('Error al eliminar cancha:', error)
      toast.error('Error al eliminar la cancha. Por favor, intenta de nuevo.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !cancha) {
    return (
      <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
        {error || 'No se encontró la cancha solicitada'}
        <div className="mt-4">
          <button 
            onClick={() => navigate('/canchas')} 
            className="btn btn-outline-background"
          >
            Volver a Canchas
          </button>
        </div>
      </div>
    )
  }

  // Formatear días disponibles para mostrar
  const diasSemana = [
    { id: 'lunes', label: 'Lunes' },
    { id: 'martes', label: 'Martes' },
    { id: 'miércoles', label: 'Miércoles' },
    { id: 'jueves', label: 'Jueves' },
    { id: 'viernes', label: 'Viernes' },
    { id: 'sábado', label: 'Sábado' },
    { id: 'domingo', label: 'Domingo' }
  ]
  
  const diasDisponiblesFormateados = diasSemana
    .filter(dia => cancha.diasDisponibles.includes(dia.id))
    .map(dia => dia.label)
    .join(', ')

  // Filtrar reservas según la vista seleccionada
  const reservasFiltradas = vistaReservas === 'proximas'
    ? reservas.filter(r => new Date(r.fecha) >= new Date())
    : reservas

  // Ordenar reservas por fecha (más recientes primero)
  const reservasOrdenadas = [...reservasFiltradas].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  )

  // Determinar el color del badge según el estado
  const getBadgeColorEstado = () => {
    switch (cancha.estado) {
      case 'disponible': return 'badge-success'
      case 'mantenimiento': return 'badge-warning'
      case 'inactiva': return 'badge-danger'
      default: return 'badge-background'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">
          {cancha.nombre}
        </h1>
        <div className="flex space-x-2">
          <Link to="/canchas" className="btn btn-outline-background">
            Volver
          </Link>
          <Link to={`/canchas/editar/${cancha._id}`} className="btn btn-outline-primary">
            Editar
          </Link>
          <Link to={`/reservas/nueva?cancha=${cancha._id}`} className="btn btn-primary">
            Nueva Reserva
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estadísticas de la cancha */}
        <div className="card bg-primary text-white">
          <h3 className="text-lg font-medium mb-4">Estadísticas</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total de reservas:</span>
              <span className="font-medium">{stats.totalReservas}</span>
            </div>
            <div className="flex justify-between">
              <span>Reservas activas:</span>
              <span className="font-medium">{stats.reservasActivas}</span>
            </div>
            <div className="flex justify-between">
              <span>Ingreso total:</span>
              <span className="font-medium">{config.moneda} {stats.ingresoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Próxima reserva:</span>
              <span className="font-medium">
                {stats.proximaReserva 
                  ? format(new Date(stats.proximaReserva), 'dd/MM/yyyy') 
                  : 'Ninguna'}
              </span>
            </div>
          </div>
        </div>

        {/* Información de la cancha */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-background-900">Información de la Cancha</h3>
            <span className={`badge ${getBadgeColorEstado()}`}>
              {cancha.estado === 'disponible' ? 'Disponible' : 
               cancha.estado === 'mantenimiento' ? 'En Mantenimiento' : 'Inactiva'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-background-500 block">Tipo:</span>
              <span>{cancha.tipo}</span>
            </div>
            
            <div>
              <span className="text-background-500 block">Precio por hora:</span>
              <span>{config.moneda} {cancha.precioHora.toFixed(2)}</span>
            </div>
            
            <div>
              <span className="text-background-500 block">Horario:</span>
              <span>{cancha.horaApertura.substring(0, 5)} - {cancha.horaCierre.substring(0, 5)}</span>
            </div>
            
            <div>
              <span className="text-background-500 block">Días disponibles:</span>
              <span>{diasDisponiblesFormateados}</span>
            </div>
          </div>
          
          {cancha.descripcion && (
            <div className="mt-4">
              <h4 className="text-background-700 font-medium mb-2">Descripción:</h4>
              <p className="text-background-600 bg-background-50 p-3 rounded-md">
                {cancha.descripcion}
              </p>
            </div>
          )}
          
          {/* Acciones de cambio de estado */}
          <div className="mt-6 pt-4 border-t border-background-200">
            <h4 className="text-background-700 font-medium mb-2">Cambiar estado:</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCambiarEstado('disponible')}
                className="btn btn-sm btn-success"
                disabled={actionLoading || cancha.estado === 'disponible'}
              >
                Disponible
              </button>
              <button
                onClick={() => handleCambiarEstado('mantenimiento')}
                className="btn btn-sm btn-warning"
                disabled={actionLoading || cancha.estado === 'mantenimiento'}
              >
                En Mantenimiento
              </button>
              <button
                onClick={() => handleCambiarEstado('inactiva')}
                className="btn btn-sm btn-danger"
                disabled={actionLoading || cancha.estado === 'inactiva'}
              >
                Inactiva
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario semanal (simplificado) */}
      <div className="card">
        <h3 className="text-lg font-medium text-background-900 mb-4">Disponibilidad Semanal</h3>
        
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-8 gap-1">
              {/* Encabezado de horas */}
              <div className="p-2 font-medium text-background-500">Hora</div>
              
              {/* Encabezados de días */}
              {Array.from({ length: 7 }, (_, i) => {
                const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
                return (
                  <div key={i} className="p-2 font-medium text-center text-background-700 bg-background-50">
                    {format(day, 'EEE d', { locale: es })}
                  </div>
                )
              })}
              
              {/* Filas de horas (simplificado) */}
              {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((hora, i) => (
                <React.Fragment key={hora}>
                  <div className="p-2 text-background-500">{hora}</div>
                  {Array.from({ length: 7 }, (_, j) => (
                    <div key={j} className="p-2 border border-background-100 min-h-[40px] text-center">
                      {/* Aquí se podría mostrar si hay reservas en este horario */}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Link to={`/reservas/nueva?cancha=${cancha._id}`} className="btn btn-primary">
            Nueva Reserva
          </Link>
        </div>
      </div>

      {/* Historial de reservas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-background-900">Reservas</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setVistaReservas('proximas')} 
              className={`btn btn-sm ${vistaReservas === 'proximas' ? 'btn-primary' : 'btn-outline-background'}`}
            >
              Próximas
            </button>
            <button 
              onClick={() => setVistaReservas('todas')} 
              className={`btn btn-sm ${vistaReservas === 'todas' ? 'btn-primary' : 'btn-outline-background'}`}
            >
              Todas
            </button>
          </div>
        </div>

        {reservasOrdenadas.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Fecha</th>
                  <th className="table-header-cell">Horario</th>
                  <th className="table-header-cell">Cliente</th>
                  <th className="table-header-cell">Estado</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {reservasOrdenadas.map((reserva) => {
                  // Determinar el color del badge según el estado
                  const getBadgeColor = () => {
                    switch (reserva.estado) {
                      case 'confirmada': return 'badge-success'
                      case 'pendiente': return 'badge-warning'
                      case 'cancelada': return 'badge-danger'
                      default: return 'badge-background'
                    }
                  }
                  
                  return (
                    <tr key={reserva._id} className="table-row">
                      <td className="table-cell">
                        {format(new Date(reserva.fecha), 'dd/MM/yyyy')}
                      </td>
                      <td className="table-cell">
                        {reserva.horaInicio.substring(0, 5)} - {reserva.horaFin.substring(0, 5)}
                      </td>
                      <td className="table-cell">
                        <Link to={`/clientes/${reserva.cliente._id}`} className="text-primary hover:underline">
                          {reserva.cliente.nombre} {reserva.cliente.apellido}
                        </Link>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-1">
                          <span className={`badge ${getBadgeColor()}`}>
                            {reserva.estado === 'confirmada' ? 'Confirmada' : 
                            reserva.estado === 'pendiente' ? 'Pendiente' : 'Cancelada'}
                          </span>
                          {reserva.estado !== 'cancelada' && (
                            <span className={`badge ${reserva.pagado ? 'badge-success' : 'badge-warning'}`}>
                              {reserva.pagado ? 'Pagada' : 'Pendiente de pago'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <Link to={`/reservas/${reserva._id}`} className="btn btn-sm btn-outline-primary">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-background-500">
            {vistaReservas === 'proximas' 
              ? 'No hay reservas próximas para esta cancha.' 
              : 'Esta cancha no tiene reservas registradas.'}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex justify-end">
        <button
          onClick={handleEliminar}
          className="btn btn-danger"
          disabled={actionLoading}
        >
          {actionLoading ? 'Procesando...' : 'Eliminar Cancha'}
        </button>
      </div>
    </div>
  )
}

export default DetalleCancha