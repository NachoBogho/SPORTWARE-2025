import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfigStore } from '../stores/configStore'

interface Reserva {
  _id: string
  cancha: {
    _id: string
    nombre: string
    tipo: string
  }
  cliente: {
    _id: string
    nombre: string
    apellido: string
    email: string
    telefono: string
  }
  fecha: string
  horaInicio: string
  horaFin: string
  duracion: number
  precio: number
  estado: 'confirmada' | 'pendiente' | 'cancelada'
  pagado: boolean
  observaciones: string
  createdAt: string
  updatedAt: string
}

const DetalleReserva = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { config } = useConfigStore()
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        const response = await axios.get(`/api/reservas/${id}`)
        setReserva(response.data)
      } catch (err) {
        console.error('Error al cargar reserva:', err)
        setError('No se pudo cargar la información de la reserva. Por favor, intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchReserva()
    }
  }, [id])

  const handleCancelar = async () => {
    if (!reserva) return
    
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      return
    }
    
    setActionLoading(true)
    
    try {
      await axios.put(`/api/reservas/${reserva._id}/cancelar`)
      toast.success('Reserva cancelada exitosamente')
      // Actualizar el estado local
      setReserva(prev => prev ? { ...prev, estado: 'cancelada' } : null)
    } catch (error) {
      console.error('Error al cancelar reserva:', error)
      toast.error('Error al cancelar la reserva. Por favor, intenta de nuevo.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarcarPagado = async () => {
    if (!reserva) return
    
    setActionLoading(true)
    
    try {
      await axios.put(`/api/reservas/${reserva._id}/pagar`)
      toast.success('Reserva marcada como pagada')
      // Actualizar el estado local
      setReserva(prev => prev ? { ...prev, pagado: true } : null)
    } catch (error) {
      console.error('Error al marcar como pagada:', error)
      toast.error('Error al marcar la reserva como pagada. Por favor, intenta de nuevo.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEliminar = async () => {
    if (!reserva) return
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.')) {
      return
    }
    
    setActionLoading(true)
    
    try {
      await axios.delete(`/api/reservas/${reserva._id}`)
      toast.success('Reserva eliminada exitosamente')
      navigate('/reservas')
    } catch (error) {
      console.error('Error al eliminar reserva:', error)
      toast.error('Error al eliminar la reserva. Por favor, intenta de nuevo.')
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

  if (error || !reserva) {
    return (
      <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
        {error || 'No se encontró la reserva solicitada'}
        <div className="mt-4">
          <button 
            onClick={() => navigate('/reservas')} 
            className="btn btn-outline-background"
          >
            Volver a Reservas
          </button>
        </div>
      </div>
    )
  }

  // Formatear fecha y hora para mostrar
  const fechaFormateada = format(new Date(reserva.fecha), 'EEEE d \\de MMMM \\de yyyy', { locale: es })
  const horaInicio = reserva.horaInicio.substring(0, 5)
  const horaFin = reserva.horaFin.substring(0, 5)

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Detalle de Reserva</h1>
        <div className="flex space-x-2">
          <Link to="/reservas" className="btn btn-outline-background">
            Volver
          </Link>
          <Link to={`/reservas/editar/${reserva._id}`} className="btn btn-outline-primary">
            Editar
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium text-background-900">
              Reserva #{reserva._id.substring(reserva._id.length - 6)}
            </h2>
            <p className="text-background-500 text-sm">
              Creada el {format(new Date(reserva.createdAt), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <span className={`badge ${getBadgeColor()}`}>
              {reserva.estado === 'confirmada' ? 'Confirmada' : 
               reserva.estado === 'pendiente' ? 'Pendiente' : 'Cancelada'}
            </span>
            <span className={`badge ${reserva.pagado ? 'badge-success' : 'badge-warning'}`}>
              {reserva.pagado ? 'Pagada' : 'Pendiente de pago'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Información de la reserva */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-background-900 mb-4">Información de la Reserva</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-background-500">Fecha:</span>
                  <span className="font-medium">{fechaFormateada}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-background-500">Horario:</span>
                  <span className="font-medium">{horaInicio} - {horaFin} ({reserva.duracion} hora{reserva.duracion !== 1 ? 's' : ''})</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-background-500">Precio:</span>
                  <span className="font-medium">{config.moneda} {reserva.precio.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-background-900 mb-4">Cancha</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-background-500">Nombre:</span>
                  <Link to={`/canchas/${reserva.cancha._id}`} className="font-medium text-primary hover:underline">
                    {reserva.cancha.nombre}
                  </Link>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-background-500">Tipo:</span>
                  <span className="font-medium">{reserva.cancha.tipo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-background-900 mb-4">Cliente</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-background-500">Nombre:</span>
                  <Link to={`/clientes/${reserva.cliente._id}`} className="font-medium text-primary hover:underline">
                    {reserva.cliente.nombre} {reserva.cliente.apellido}
                  </Link>
                </div>
                
                {reserva.cliente.email && (
                  <div className="flex justify-between">
                    <span className="text-background-500">Email:</span>
                    <a href={`mailto:${reserva.cliente.email}`} className="font-medium text-primary hover:underline">
                      {reserva.cliente.email}
                    </a>
                  </div>
                )}
                
                {reserva.cliente.telefono && (
                  <div className="flex justify-between">
                    <span className="text-background-500">Teléfono:</span>
                    <a href={`tel:${reserva.cliente.telefono}`} className="font-medium text-primary hover:underline">
                      {reserva.cliente.telefono}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {reserva.observaciones && (
              <div>
                <h3 className="text-lg font-medium text-background-900 mb-4">Observaciones</h3>
                <p className="text-background-700 bg-background-50 p-3 rounded-md">
                  {reserva.observaciones}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-8 pt-6 border-t border-background-200">
          <div className="flex flex-wrap gap-3 justify-end">
            {reserva.estado !== 'cancelada' && (
              <button
                onClick={handleCancelar}
                className="btn btn-outline-danger"
                disabled={actionLoading}
              >
                {actionLoading ? 'Procesando...' : 'Cancelar Reserva'}
              </button>
            )}
            
            {!reserva.pagado && reserva.estado !== 'cancelada' && (
              <button
                onClick={handleMarcarPagado}
                className="btn btn-outline-success"
                disabled={actionLoading}
              >
                {actionLoading ? 'Procesando...' : 'Marcar como Pagada'}
              </button>
            )}
            
            <button
              onClick={handleEliminar}
              className="btn btn-danger"
              disabled={actionLoading}
            >
              {actionLoading ? 'Procesando...' : 'Eliminar Reserva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetalleReserva