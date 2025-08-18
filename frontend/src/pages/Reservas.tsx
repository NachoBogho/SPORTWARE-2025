import React from 'react';
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FunnelIcon as FilterIcon } from '@heroicons/react/24/outline'
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
  }
  fechaInicio: string
  fechaFin: string
  estado: 'confirmada' | 'pendiente' | 'cancelada'
  precio: number
  pagado: boolean
  observaciones?: string
  createdAt: string
  updatedAt: string
}

const Reservas = () => {
  const { config } = useConfigStore()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null)

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      await fetchReservas();
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, fechaFiltro])

  const fetchReservas = async () => {
    setLoading(true)
    setError('')
    try {
      let url = '/api/reservas'
      
      // Aplicar filtros
      if (filtro === 'hoy') {
        url = `/api/reservas/fecha/${format(new Date(), 'yyyy-MM-dd')}`
      } else if (filtro === 'semana') {
        url = '/api/reservas/semana'
      } else if (filtro === 'mes') {
        url = '/api/reservas/mes'
      } else if (filtro === 'fecha' && fechaFiltro) {
        url = `/api/reservas/fecha/${fechaFiltro}`
      }
      
      const response = await axios.get(url)
      setReservas(response.data)
    } catch (err) {
      console.error('Error al cargar reservas:', err)
      setError('Error al cargar las reservas. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelarReserva = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return
    
    try {
      await axios.patch(`/api/reservas/${id}/cancelar`) // cambiado de put a patch
      fetchReservas()
    } catch (err: any) {
      console.error('Error al cancelar la reserva:', err)
      setError(err.response?.data?.mensaje || 'Error al cancelar la reserva. Por favor, intenta de nuevo.')
    }
  }

  const handleMarcarPagado = async (id: string) => {
    try {
      await axios.patch(`/api/reservas/${id}/pagar`) // cambiado de put a patch
      fetchReservas()
    } catch (err: any) {
      console.error('Error al marcar como pagado:', err)
      setError(err.response?.data?.mensaje || 'Error al marcar como pagado. Por favor, intenta de nuevo.')
    }
  }

  const handleEliminarReserva = async (id: string) => {
    // Reemplazado por modal: solo abre modal
    const r = reservas.find(r => r._id === id)
    if (!r) return
    setReservaSeleccionada(r)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!reservaSeleccionada) return
    try {
      await axios.delete(`/api/reservas/${reservaSeleccionada._id}`)
      setShowDeleteModal(false)
      setReservaSeleccionada(null)
      fetchReservas()
    } catch (err) {
      console.error('Error al eliminar la reserva:', err)
      setError('Error al eliminar la reserva. Por favor, intenta de nuevo.')
    }
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setReservaSeleccionada(null)
  }

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'confirmada': return 'badge-success'
      case 'pendiente': return 'badge-warning'
      case 'cancelada': return 'badge-danger'
      default: return 'badge-info'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Reservas</h1>
        <Link to="/reservas/nueva" className="btn btn-primary">
          <PlusIcon className="h-5 w-5 mr-1" />
          Nueva Reserva
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <FilterIcon className="h-5 w-5 text-background-500 mr-2" />
            <span className="text-background-700 font-medium">Filtrar por:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltro('todas')}
              className={`btn ${filtro === 'todas' ? 'btn-primary' : 'btn-outline-primary'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltro('hoy')}
              className={`btn ${filtro === 'hoy' ? 'btn-primary' : 'btn-outline-primary'}`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFiltro('semana')}
              className={`btn ${filtro === 'semana' ? 'btn-primary' : 'btn-outline-primary'}`}
            >
              Esta semana
            </button>
            <button
              onClick={() => setFiltro('mes')}
              className={`btn ${filtro === 'mes' ? 'btn-primary' : 'btn-outline-primary'}`}
            >
              Este mes
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <CalendarIcon className="h-5 w-5 text-background-500" />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => {
                setFechaFiltro(e.target.value)
                setFiltro('fecha')
              }}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Tabla de reservas */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Cancha</th>
                <th className="table-header-cell">Fecha</th>
                <th className="table-header-cell">Horario</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Precio</th>
                <th className="table-header-cell">Pagado</th>
                <th className="table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : reservas.length > 0 ? (
                reservas.map((reserva) => (
                  <tr key={reserva._id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/clientes/${reserva.cliente._id}`} className="text-primary hover:underline">
                        {reserva.cliente.nombre} {reserva.cliente.apellido}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <Link to={`/canchas/${reserva.cancha._id}`} className="text-primary hover:underline">
                        {reserva.cancha.nombre}
                      </Link>
                      <span className="text-xs text-background-500 block">{reserva.cancha.tipo}</span>
                    </td>
                    <td className="table-cell">
                      {format(parseISO(reserva.fechaInicio), 'EEEE dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="table-cell">
                      {format(parseISO(reserva.fechaInicio), 'HH:mm')} - {format(parseISO(reserva.fechaFin), 'HH:mm')}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getEstadoClass(reserva.estado)}`}>
                        {reserva.estado}
                      </span>
                    </td>
                    <td className="table-cell">
                      {config.moneda} {reserva.precio.toFixed(2)}
                    </td>
                    <td className="table-cell">
                      {reserva.pagado ? (
                        <span className="text-green-600 flex items-center">
                          <CheckIcon className="h-5 w-5 mr-1" />
                          Sí
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleMarcarPagado(reserva._id)}
                          className="text-amber-600 hover:text-amber-800 flex items-center"
                          disabled={reserva.estado === 'cancelada'}
                        >
                          <XMarkIcon className="h-5 w-5 mr-1" />
                          No
                        </button>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link to={`/reservas/editar/${reserva._id}`} className="btn-icon btn-icon-primary">
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        
                        {reserva.estado !== 'cancelada' && (
                          <button 
                            onClick={() => handleCancelarReserva(reserva._id)}
                            className="btn-icon btn-icon-warning"
                            title="Cancelar reserva"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleEliminarReserva(reserva._id)}
                          className="btn-icon btn-icon-danger"
                          title="Eliminar reserva"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-background-500">
                    No hay reservas que coincidan con los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal eliminar reserva */}
      {showDeleteModal && reservaSeleccionada && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDeleteModal}></div>
          <div className="relative z-50 w-full max-w-md mx-4 rounded-lg shadow-lg bg-white border border-background-200">
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-background-900 mb-2">
                Eliminar reserva
              </h3>
              <p className="text-background-600 text-sm leading-relaxed text-gray-900">
                ¿Seguro que deseas eliminar la reserva de{' '}
                <span className="font-medium">
                  {reservaSeleccionada.cliente.nombre} {reservaSeleccionada.cliente.apellido}
                </span>{' '}
                para la cancha{' '}
                <span className="font-medium">
                  {reservaSeleccionada.cancha.nombre}
                </span>{' '}
                el{' '}
                {format(parseISO(reservaSeleccionada.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}?
                Esta acción es permanente.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="btn btn-outline-primary text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn btn-outline-danger text-gray-900 bg-danger/10 hover:bg-danger/20"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reservas