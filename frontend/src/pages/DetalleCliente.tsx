import React from 'react'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfigStore } from '../stores/configStore'
import { useNotificationsStore } from '../stores/notificationsStore'

interface Cliente {
  _id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  codigoPostal: string
  notas: string
  createdAt: string
  updatedAt: string
}

interface Reserva {
  _id: string
  cancha: {
    _id: string
    nombre: string
    tipo: string
  }
  fecha: string
  horaInicio: string
  horaFin: string
  precio: number
  estado: 'confirmada' | 'pendiente' | 'cancelada'
  pagado: boolean
}

interface ClienteStats {
  totalReservas: number
  reservasCanceladas: number
  gastoTotal: number
  ultimaReserva: string | null
}

const DetalleCliente = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { config } = useConfigStore()
  const addNotification = useNotificationsStore(s => s.addNotification)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [stats, setStats] = useState<ClienteStats>({
    totalReservas: 0,
    reservasCanceladas: 0,
    gastoTotal: 0,
    ultimaReserva: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  function safeFormat(dateStr?: string | null) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? '-' : format(d, 'dd/MM/yyyy')
  }

  function formatTime(value?: string | null) {
    if (!value || typeof value !== 'string') return '-'
    // Aceptar formatos HH:MM o HH:MM:SS
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return '-'
    return value.substring(0,5)
  }

  useEffect(() => {
    const fetchClienteYReservas = async () => {
      setLoading(true)
      setError('')
      try {
        const clienteReq = axios.get(`/api/clientes/${id}`)
        const reservasReq = axios.get(`/api/reservas`, { params: { cliente: id } })
        const [clienteResponse, reservasResponse] = await Promise.allSettled([clienteReq, reservasReq])

        if (clienteResponse.status === 'fulfilled') {
          setCliente(clienteResponse.value.data)
        } else {
          const status = clienteResponse.reason?.response?.status
          if (status === 404) {
            setError('Cliente no encontrado')
          } else {
            setError('No se pudo cargar el cliente')
          }
          setLoading(false)
          return
        }

        if (reservasResponse.status === 'fulfilled') {
          const reservasData = reservasResponse.value.data
          setReservas(reservasData)

          // Calcular estadísticas
          const totalReservas = reservasData.length
          const reservasCanceladas = reservasData.filter(
            (r: Reserva) => r.estado === 'cancelada'
          ).length
          const gastoTotal = reservasData
            .filter((r: Reserva) => r.pagado && r.estado !== 'cancelada')
            .reduce((sum: number, r: Reserva) => sum + (r.precio || 0), 0)

          let ultimaReserva: string | null = null
          if (totalReservas > 0) {
            const reservasOrdenadas = [...reservasData].sort(
              (a: Reserva, b: Reserva) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            )
            ultimaReserva = reservasOrdenadas[0]?.fecha || null
          }

          setStats({
            totalReservas,
            reservasCanceladas,
            gastoTotal,
            ultimaReserva
          })
        } else {
          console.warn('Fallo al obtener reservas:', reservasResponse.reason)
        }
      } catch (err) {
        console.error('Error al cargar detalle de cliente:', err)
        setError('No se pudo cargar la información del cliente. Por favor, intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchClienteYReservas()
  }, [id])

  const handleEliminar = async () => {
    if (!cliente) return
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al cliente ${cliente.nombre} ${cliente.apellido}? Esta acción no se puede deshacer.`)) {
      return
    }
    
    setActionLoading(true)
    
    try {
      // Verificar si el cliente tiene reservas activas
      const reservasActivas = reservas.filter(r => r.estado !== 'cancelada')
      if (reservasActivas.length > 0) {
        if (!window.confirm(`Este cliente tiene ${reservasActivas.length} reserva(s) activa(s). ¿Estás seguro de que deseas eliminarlo?`)) {
          setActionLoading(false)
          return
        }
      }
      
      await axios.delete(`/api/clientes/${cliente._id}`)
      addNotification(`Cliente eliminado: ${cliente.nombre} ${cliente.apellido}`, 'warning', { clienteId: cliente._id })
      toast.success('Cliente eliminado exitosamente')
      navigate('/clientes')
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
      addNotification('Error al eliminar cliente', 'error', { clienteId: cliente?._id })
      toast.error('Error al eliminar el cliente. Por favor, intenta de nuevo.')
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

  if (error || !cliente) {
    return (
      <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
        {error || 'No se encontró el cliente solicitado'}
        <div className="mt-4">
          <button 
            onClick={() => navigate('/clientes')} 
            className="btn btn-outline-background"
          >
            Volver a Clientes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">
          {cliente.nombre} {cliente.apellido}
        </h1>
        <div className="flex space-x-2">
          <Link to="/clientes" className="btn btn-outline-background">
            Volver
          </Link>
          <Link to={`/clientes/editar/${cliente._id}`} className="btn btn-outline-primary">
            Editar
          </Link>
          <Link to={`/reservas/nueva?cliente=${cliente._id}`} className="btn btn-primary">
            Nueva Reserva
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estadísticas del cliente */}
        <div className="card bg-primary text-white">
          <h3 className="text-lg font-medium mb-4">Estadísticas</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total de reservas:</span>
              <span className="font-medium">{stats.totalReservas}</span>
            </div>
            <div className="flex justify-between">
              <span>Reservas canceladas:</span>
              <span className="font-medium">{stats.reservasCanceladas}</span>
            </div>
            <div className="flex justify-between">
              <span>Gasto total:</span>
              <span className="font-medium">{(config && config.moneda) ? config.moneda : '$'} {stats.gastoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Última reserva:</span>
              <span className="font-medium">
                {stats.ultimaReserva ? safeFormat(stats.ultimaReserva) : 'Ninguna'}
              </span>
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="card md:col-span-2">
          <h3 className="text-lg font-medium text-background-900 mb-4">Información de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cliente.email && (
              <div>
                <span className="text-background-500 block">Email:</span>
                <a href={`mailto:${cliente.email}`} className="text-primary hover:underline">
                  {cliente.email}
                </a>
              </div>
            )}
            
            {cliente.telefono && (
              <div>
                <span className="text-background-500 block">Teléfono:</span>
                <a href={`tel:${cliente.telefono}`} className="text-primary hover:underline">
                  {cliente.telefono}
                </a>
              </div>
            )}
            
            {cliente.direccion && (
              <div>
                <span className="text-background-500 block">Dirección:</span>
                <span>{cliente.direccion}</span>
                {(cliente.ciudad || cliente.codigoPostal) && (
                  <span>, {cliente.ciudad} {cliente.codigoPostal}</span>
                )}
              </div>
            )}
            
            <div>
              <span className="text-background-500 block">Cliente desde:</span>
              <span>{safeFormat(cliente.createdAt)}</span>
            </div>
          </div>
          
          {cliente.notas && (
            <div className="mt-4">
              <h4 className="text-background-700 font-medium mb-2">Notas:</h4>
              <p className="text-background-600 bg-background-50 p-3 rounded-md">
                {cliente.notas}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historial de reservas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-background-900">Historial de Reservas</h3>
          <Link to={`/reservas/nueva?cliente=${cliente._id}`} className="btn btn-sm btn-primary">
            Nueva Reserva
          </Link>
        </div>

        {reservas.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Fecha</th>
                  <th className="table-header-cell">Horario</th>
                  <th className="table-header-cell">Cancha</th>
                  <th className="table-header-cell">Estado</th>
                  <th className="table-header-cell">Precio</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {reservas.map((reserva) => {
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
                        {safeFormat(reserva.fecha)}
                      </td>
                      <td className="table-cell">
                        {formatTime(reserva.horaInicio)} - {formatTime(reserva.horaFin)}
                      </td>
                      <td className="table-cell">
                        {reserva.cancha? (
                          <Link to={`/canchas/${reserva.cancha._id}`} className="text-primary hover:underline">
                            {reserva.cancha.nombre}
                          </Link>
                        ) : (
                          <span className="text-background-400 italic">Sin cancha</span>
                        )}
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
                        {(config && config.moneda) ? config.moneda : '$'} {reserva.precio.toFixed(2)}
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
            Este cliente no tiene reservas registradas.
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
          {actionLoading ? 'Procesando...' : 'Eliminar Cliente'}
        </button>
      </div>
    </div>
  )
}

export default DetalleCliente